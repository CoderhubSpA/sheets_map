import test from 'node:test'
import assert from 'node:assert/strict'

import {
    MAX_RETRY_AFTER_MS,
    NOMINATIM_ERROR_KIND,
    buildSearchUrl,
    createNominatimClient,
    createNominatimState,
    normalizeQuery,
    parseBoundingBox,
    parseCoordinates,
    parseRetryAfter,
} from '../src/components/search_engines/nominatimClient.js'

const SANTIAGO = {
    display_name: 'Santiago, Provincia de Santiago, Región Metropolitana, Chile',
    lat: '-33.4377756',
    lon: '-70.6504502',
    boundingbox: ['-33.5277756', '-33.3477756', '-70.7404502', '-70.5604502'],
}

function jsonResponse(status, body = [], headers = {}) {
    const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]))
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get: (name) => lower[name.toLowerCase()] ?? null },
        json: async () => body,
    }
}

// Reloj falso: sleep avanza el tiempo en vez de esperar.
function fakeClock(start = 10_000) {
    const clock = { time: start, sleeps: [] }
    clock.now = () => clock.time
    clock.sleep = async (ms) => {
        clock.sleeps.push(ms)
        clock.time += ms
    }
    return clock
}

function setup(responses) {
    const clock = fakeClock()
    const calls = []
    const queue = [...responses]
    const fetchImpl = async (url) => {
        calls.push({ url, at: clock.time })
        const next = queue.shift()
        if (next instanceof Error) throw next
        return next
    }
    const client = createNominatimClient({
        fetchImpl,
        now: clock.now,
        sleep: clock.sleep,
        state: createNominatimState(),
    })
    return { client, clock, calls }
}

test('arma la URL de búsqueda con los parámetros de la política de uso', () => {
    const url = new URL(buildSearchUrl('  Talca ', { email: 'equipo@example.cl' }))
    assert.equal(url.origin + url.pathname, 'https://nominatim.openstreetmap.org/search')
    assert.equal(url.searchParams.get('format'), 'jsonv2')
    assert.equal(url.searchParams.get('q'), 'Talca')
    assert.equal(url.searchParams.get('countrycodes'), 'cl')
    assert.equal(url.searchParams.get('limit'), '8')
    assert.equal(url.searchParams.get('addressdetails'), '0')
    assert.equal(url.searchParams.get('accept-language'), 'es')
    assert.equal(url.searchParams.get('email'), 'equipo@example.cl')
})

test('permite configurar servidor y países, y omite email si no está configurado', () => {
    const url = new URL(buildSearchUrl('x', { nominatim_url: 'https://geo.example.cl/', countrycodes: 'cl,ar' }))
    assert.equal(url.origin + url.pathname, 'https://geo.example.cl/search')
    assert.equal(url.searchParams.get('countrycodes'), 'cl,ar')
    assert.equal(url.searchParams.has('email'), false)
    assert.equal(url.searchParams.has('key'), false)
})

test('envía la API key como parámetro key cuando está configurada', () => {
    const url = new URL(buildSearchUrl('x', { nominatim_url: 'https://us1.locationiq.com/v1', nominatim_api_key: 'pk.123' }))
    assert.equal(url.origin + url.pathname, 'https://us1.locationiq.com/v1/search')
    assert.equal(url.searchParams.get('key'), 'pk.123')
})

test('normaliza la consulta con trim y minúsculas', () => {
    assert.equal(normalizeQuery('  Región del MAULE '), 'región del maule')
    assert.equal(normalizeQuery(null), '')
})

test('reconoce coordenadas "lat, lon" válidas y rechaza las fuera de rango', () => {
    assert.deepEqual(parseCoordinates('-33.45, -70.66'), [-33.45, -70.66])
    assert.deepEqual(parseCoordinates('-33,-70'), [-33, -70])
    assert.equal(parseCoordinates('-95, -70'), null)
    assert.equal(parseCoordinates('Santiago'), null)
})

test('convierte boundingbox de Nominatim [s, n, w, e] a [[s, w], [n, e]]', () => {
    assert.deepEqual(parseBoundingBox(SANTIAGO.boundingbox), [
        [-33.5277756, -70.7404502],
        [-33.3477756, -70.5604502],
    ])
    assert.equal(parseBoundingBox(['a', 'b', 'c', 'd']), null)
    assert.equal(parseBoundingBox(['-33', '-34', '-70', '-71']), null)
    assert.equal(parseBoundingBox(undefined), null)
})

test('interpreta Retry-After en segundos o fecha y lo acota a 5 s', () => {
    assert.equal(parseRetryAfter('2'), 2000)
    assert.equal(parseRetryAfter('120'), MAX_RETRY_AFTER_MS)
    assert.equal(parseRetryAfter(new Date(13_000).toUTCString(), 10_000), 3000)
    assert.equal(parseRetryAfter(null), null)
    assert.equal(parseRetryAfter('mañana'), null)
})

test('devuelve lugares con bounds y usa caché para la misma consulta normalizada', async () => {
    const { client, calls } = setup([jsonResponse(200, [SANTIAGO])])
    const first = await client.search('Santiago')
    const second = await client.search('  SANTIAGO ')

    assert.equal(calls.length, 1)
    assert.equal(first, second)
    assert.equal(first[0].label, SANTIAGO.display_name)
    assert.equal(first[0].lat, -33.4377756)
    assert.deepEqual(first[0].bounds, [[-33.5277756, -70.7404502], [-33.3477756, -70.5604502]])
})

test('respeta 1 solicitud por segundo entre búsquedas distintas', async () => {
    const { client, clock, calls } = setup([jsonResponse(200, []), jsonResponse(200, [])])
    await client.search('uno')
    clock.time += 300
    await client.search('dos')

    assert.equal(calls.length, 2)
    assert.equal(calls[1].at - calls[0].at, 1000)
    assert.deepEqual(clock.sleeps, [700])
})

test('el throttle es compartido entre clientes que usan el mismo estado', async () => {
    const clock = fakeClock()
    const state = createNominatimState()
    const calls = []
    const fetchImpl = async (url) => {
        calls.push(clock.time)
        return jsonResponse(200, [])
    }
    const a = createNominatimClient({ fetchImpl, now: clock.now, sleep: clock.sleep, state })
    const b = createNominatimClient({ fetchImpl, now: clock.now, sleep: clock.sleep, state })
    await Promise.all([a.search('uno'), b.search('dos')])

    assert.equal(calls.length, 2)
    assert.ok(calls[1] - calls[0] >= 1000)
})

test('reintenta ante 429 respetando Retry-After y luego responde', async () => {
    const { client, clock, calls } = setup([
        jsonResponse(429, null, { 'Retry-After': '2' }),
        jsonResponse(200, [SANTIAGO]),
    ])
    const places = await client.search('Santiago')

    assert.equal(calls.length, 2)
    assert.equal(places.length, 1)
    assert.equal(clock.sleeps[0], 2000)
})

test('ante 503 reintenta como máximo 2 veces (1 s y 3 s) y reporta ocupado', async () => {
    const { client, clock, calls } = setup([
        jsonResponse(503),
        jsonResponse(503),
        jsonResponse(503),
    ])
    await assert.rejects(client.search('Talca'), (error) => {
        assert.equal(error.kind, NOMINATIM_ERROR_KIND.BUSY)
        assert.equal(error.status, 503)
        return true
    })
    assert.equal(calls.length, 3)
    assert.deepEqual(clock.sleeps, [1000, 3000])
})

test('Retry-After grande se acota a 5 s', async () => {
    const { client, clock } = setup([
        jsonResponse(429, null, { 'Retry-After': '3600' }),
        jsonResponse(200, []),
    ])
    await client.search('Maule')
    assert.equal(clock.sleeps[0], MAX_RETRY_AFTER_MS)
})

test('no reintenta ante 403 ni otros 4xx', async () => {
    for (const status of [403, 400, 404]) {
        const { client, calls } = setup([jsonResponse(status), jsonResponse(200, [])])
        await assert.rejects(client.search('Curicó'), (error) => {
            assert.equal(error.kind, NOMINATIM_ERROR_KIND.FAILED)
            assert.equal(error.status, status)
            return true
        })
        assert.equal(calls.length, 1)
    }
})

test('reintenta ante errores de red y falla tras agotar reintentos', async () => {
    const { client, calls } = setup([
        new TypeError('Failed to fetch'),
        new TypeError('Failed to fetch'),
        new TypeError('Failed to fetch'),
    ])
    await assert.rejects(client.search('Linares'), (error) => error.kind === NOMINATIM_ERROR_KIND.FAILED)
    assert.equal(calls.length, 3)
})

test('no guarda en caché las respuestas fallidas', async () => {
    const { client, calls } = setup([jsonResponse(403), jsonResponse(200, [SANTIAGO])])
    await assert.rejects(client.search('Santiago'))
    const places = await client.search('Santiago')
    assert.equal(places.length, 1)
    assert.equal(calls.length, 2)
})
