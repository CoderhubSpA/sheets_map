// Cliente mínimo para el servicio de búsqueda de Nominatim (OpenStreetMap):
// - como máximo 1 solicitud por segundo desde cada pestaña (estado compartido a nivel de módulo).
//   Este límite no suma usuarios: el límite agregado que exige el servidor público lo aplica
//   un proxy del anfitrión (en Sheets, /nominatim), que se configura como nominatim_url,
// - sin autocompletar (solo se consulta cuando la persona lo pide),
// - caché en memoria para no repetir consultas,
// - reintentos acotados solo ante 429/503 o fallas de red, sin adelantarse a Retry-After.
// Se usa fetch y no axios a propósito: así no viajan a OSM los encabezados globales
// (CSRF, Authorization) que la aplicación anfitriona pueda haber configurado en axios.

export const NOMINATIM_DEFAULT_URL = 'https://nominatim.openstreetmap.org'
export const NOMINATIM_DEFAULT_COUNTRYCODES = 'cl'
export const NOMINATIM_RESULT_LIMIT = 8
export const MIN_REQUEST_INTERVAL_MS = 1000
export const RETRY_DELAYS_MS = Object.freeze([1000, 3000])
// Espera máxima que acepta la interfaz antes de avisar que el buscador está ocupado.
// No acorta Retry-After: si el servidor pide más, no se vuelve a consultar antes de lo indicado.
export const MAX_WAIT_MS = 5000
export const REQUEST_TIMEOUT_MS = 10000
const MAX_CACHE_ENTRIES = 100
const RETRYABLE_STATUSES = new Set([429, 503])
const INVALID_BODY = Symbol('invalid-body')

export const NOMINATIM_ERROR_KIND = Object.freeze({
    BUSY: 'busy',
    FAILED: 'failed',
})

export class NominatimError extends Error {
    constructor(kind, message, status = null) {
        super(message)
        this.name = 'NominatimError'
        this.kind = kind
        this.status = status
    }
}

export function createNominatimState() {
    return {
        lastRequestAt: null,
        // Instante desde el que se puede volver a consultar, según el último Retry-After.
        nextAllowedAt: 0,
        queue: Promise.resolve(),
        cache: new Map(),
    }
}

// Estado compartido por todas las instancias del buscador en la pestaña.
const sharedState = createNominatimState()

export function normalizeQuery(query) {
    return String(query ?? '').trim().toLowerCase()
}

// Misma validación que SearchBarGoogleMap: "lat, lon" con rangos válidos.
export function parseCoordinates(text) {
    const coordinatePattern = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/
    const value = String(text ?? '').trim()
    if (!coordinatePattern.test(value)) return null

    const [lat, lon] = value.split(',').map((part) => Number(part.trim()))
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return [lat, lon]
    }
    return null
}

export function buildSearchUrl(query, config = {}) {
    const baseUrl = String(config.nominatim_url || NOMINATIM_DEFAULT_URL).replace(/\/+$/, '')
    const countrycodes = config.countrycodes === undefined || config.countrycodes === null
        ? NOMINATIM_DEFAULT_COUNTRYCODES
        : String(config.countrycodes)
    const params = new URLSearchParams({ format: 'jsonv2', q: String(query).trim() })
    if (countrycodes) params.set('countrycodes', countrycodes)
    params.set('limit', String(NOMINATIM_RESULT_LIMIT))
    params.set('addressdetails', '0')
    params.set('accept-language', 'es')
    if (config.email) params.set('email', String(config.email))
    // El servidor público de OSM no usa key; los proveedores compatibles (p. ej. LocationIQ) la piden como `key`.
    if (config.nominatim_api_key) params.set('key', String(config.nominatim_api_key))

    return `${baseUrl}/search?${params.toString()}`
}

// Nominatim entrega boundingbox como [south, north, west, east] en strings.
// Leaflet espera [[south, west], [north, east]].
export function parseBoundingBox(boundingbox) {
    if (!Array.isArray(boundingbox) || boundingbox.length !== 4) return null

    const [south, north, west, east] = boundingbox.map(Number)
    if (![south, north, west, east].every(Number.isFinite)) return null
    if (south > north || south < -90 || north > 90 || west < -180 || east > 180) return null

    return [[south, west], [north, east]]
}

export function toPlace(item) {
    if (!item || typeof item !== 'object') return null

    const lat = Number(item.lat)
    const lon = Number(item.lon)
    // El proveedor es configurable: no se encuadra un punto fuera de rango.
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null

    return {
        label: item.display_name || `${lat}, ${lon}`,
        lat,
        lon,
        bounds: parseBoundingBox(item.boundingbox),
    }
}

// Retry-After puede venir en segundos o como fecha HTTP. Devuelve la espera completa en ms.
export function parseRetryAfter(headerValue, nowMs = Date.now()) {
    if (headerValue === null || headerValue === undefined || headerValue === '') return null

    const text = String(headerValue).trim()
    let delayMs = null
    if (/^\d+(\.\d+)?$/.test(text)) {
        delayMs = Number(text) * 1000
    } else {
        const date = Date.parse(text)
        if (Number.isFinite(date)) delayMs = Math.max(0, date - nowMs)
    }
    return delayMs
}

function busyError(status = null) {
    return new NominatimError(NOMINATIM_ERROR_KIND.BUSY, 'Nominatim está ocupado', status)
}

function defaultSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function defaultFetch(...args) {
    return globalThis.fetch(...args)
}

// Reserva un turno respetando el intervalo mínimo entre solicitudes y el último Retry-After.
// Los turnos se encadenan para que dos búsquedas simultáneas tampoco superen 1 solicitud por
// segundo. Si la espera supera lo que acepta la interfaz, se avisa ocupado sin consultar.
function acquireRequestSlot(state, now, sleep) {
    const slot = state.queue.then(async () => {
        const intervalEnd = state.lastRequestAt === null ? 0 : state.lastRequestAt + MIN_REQUEST_INTERVAL_MS
        const waitMs = Math.max(intervalEnd, state.nextAllowedAt) - now()
        if (waitMs > MAX_WAIT_MS) throw busyError()
        if (waitMs > 0) await sleep(waitMs)
        state.lastRequestAt = now()
    })
    state.queue = slot.catch(() => {})
    return slot
}

function rememberResult(state, key, places) {
    if (state.cache.has(key)) state.cache.delete(key)
    state.cache.set(key, places)
    while (state.cache.size > MAX_CACHE_ENTRIES) {
        state.cache.delete(state.cache.keys().next().value)
    }
}

// El tiempo límite cubre encabezados y cuerpo: fetch resuelve al llegar los encabezados
// y la lectura del JSON puede quedar pendiente si el cuerpo se detiene.
async function fetchJsonWithTimeout(fetchImpl, url, timeoutMs) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null
    let timer = null
    const timeout = new Promise((resolve, reject) => {
        timer = setTimeout(() => {
            if (controller) controller.abort()
            reject(new Error(`sin respuesta en ${timeoutMs} ms`))
        }, timeoutMs)
    })
    try {
        const response = await Promise.race([
            fetchImpl(url, { headers: { Accept: 'application/json' }, signal: controller?.signal }),
            timeout,
        ])
        if (!response.ok) return { response, data: null }

        // Un cuerpo que no es JSON se trata como respuesta inválida, no como falla de red.
        const data = await Promise.race([response.json().catch(() => INVALID_BODY), timeout])
        return { response, data }
    } finally {
        clearTimeout(timer)
    }
}

export function createNominatimClient({
    fetchImpl = defaultFetch,
    now = () => Date.now(),
    sleep = defaultSleep,
    state = sharedState,
    timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
    async function search(query, config = {}) {
        const normalized = normalizeQuery(query)
        if (!normalized) return []

        const url = buildSearchUrl(normalized, config)
        const cacheKey = url
        if (state.cache.has(cacheKey)) return state.cache.get(cacheKey)

        for (let attempt = 0; ; attempt++) {
            await acquireRequestSlot(state, now, sleep)

            let result = null
            try {
                result = await fetchJsonWithTimeout(fetchImpl, url, timeoutMs)
            } catch (error) {
                // Falla de red o tiempo agotado: se puede reintentar.
                if (attempt < RETRY_DELAYS_MS.length) {
                    await sleep(RETRY_DELAYS_MS[attempt])
                    continue
                }
                throw new NominatimError(NOMINATIM_ERROR_KIND.FAILED, `Nominatim no respondió: ${error?.message || error}`)
            }

            const { response, data } = result
            if (response.ok) {
                // Solo un array es una respuesta válida (vacío = sin coincidencias). Un objeto de
                // error o un cuerpo inválido no se cachea, para no repetir un falso "sin resultados".
                if (!Array.isArray(data)) {
                    throw new NominatimError(NOMINATIM_ERROR_KIND.FAILED, 'Nominatim respondió en un formato inesperado', response.status)
                }
                const places = data.map(toPlace).filter(Boolean)
                rememberResult(state, cacheKey, places)
                return places
            }

            if (RETRYABLE_STATUSES.has(response.status)) {
                const retryAfter = parseRetryAfter(response.headers?.get?.('Retry-After'), now())
                // El enfriamiento vale para todas las búsquedas de la pestaña, no solo para esta.
                if (retryAfter !== null) state.nextAllowedAt = Math.max(state.nextAllowedAt, now() + retryAfter)
                if (attempt < RETRY_DELAYS_MS.length && (retryAfter ?? 0) <= MAX_WAIT_MS) {
                    // Con Retry-After, acquireRequestSlot espera hasta nextAllowedAt.
                    if (retryAfter === null) await sleep(RETRY_DELAYS_MS[attempt])
                    continue
                }
                throw busyError(response.status)
            }

            // 403 (bloqueo por política de uso) y otros errores: no se reintenta.
            throw new NominatimError(NOMINATIM_ERROR_KIND.FAILED, `Nominatim respondió HTTP ${response.status}`, response.status)
        }
    }

    return { search }
}

export const nominatimClient = createNominatimClient()
