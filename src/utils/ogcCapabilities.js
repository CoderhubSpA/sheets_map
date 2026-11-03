// Piezas comunes de los servicios OGC externos (WMS, WMTS, WFS, OGC API Features) en el navegador:
// URL del servicio, peticiones sin credenciales, lectura de GetCapabilities y códigos de CRS.

const CAPABILITIES_TIMEOUT_MS = 15000;
const MAX_CAPABILITIES_BYTES = 10 * 1024 * 1024;
const REQUEST_TIMEOUT_MESSAGE = "El servicio tardó demasiado en responder.";
const NO_RESPONSE_MESSAGE = "El servicio no respondió o no permite el acceso desde este sitio (CORS).";
const COORDINATE_DECIMALS = 6;
// Formato de imagen por omisión de los servicios de mapas; el único que todos ofrecen.
export const DEFAULT_IMAGE_FORMAT = "image/png";

// Códigos EPSG con los que los servidores anuncian Web Mercator, la proyección del visor.
const WEB_MERCATOR_CODES = new Set(["3857", "900913", "102100", "102113", "3785"]);

/**
 * Normaliza la URL de un servicio OGC externo. Devuelve `{ url }` o `{ error }` con un mensaje
 * para el usuario. `clientParams` son los parámetros que arma el cliente y se quitan de la URL.
 */
export function ogcServiceUrl(rawUrl, pageProtocol, { service, clientParams = [] }) {
    const value = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!value) return { error: `La capa no tiene la URL del servicio ${service}.` };

    let url;
    try {
        url = new URL(value);
    } catch {
        return { error: `La URL del servicio ${service} no es válida.` };
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        return { error: `La URL del servicio ${service} debe usar https.` };
    }
    // El navegador bloquea contenido http dentro de un sitio https.
    if (url.protocol === "http:" && pageProtocol === "https:") {
        return { error: `El servicio ${service} usa http y el navegador lo bloquea en un sitio https.` };
    }
    if (url.username || url.password) {
        return { error: `La URL del servicio ${service} no puede incluir credenciales.` };
    }

    const managed = new Set(clientParams);
    for (const key of Array.from(url.searchParams.keys())) {
        if (managed.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    url.hash = "";

    return { url: url.toString() };
}

/** Código numérico final de un identificador de CRS («EPSG:3857», «urn:ogc:def:crs:EPSG::4326»…). */
export function crsCode(crs) {
    const code = /(\d+)\s*$/.exec(crs || "");
    return code ? code[1] : null;
}

export const isWebMercator = (crs) => WEB_MERCATOR_CODES.has(crsCode(crs));

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Redondea una coordenada a los decimales que se envían al servicio. */
export const roundCoordinate = (value) => Math.round(value * 10 ** COORDINATE_DECIMALS) / 10 ** COORDINATE_DECIMALS;

/**
 * Pide `url` a un servicio externo con tiempo máximo y entrega la respuesta a `read`, que lee el
 * cuerpo dentro del mismo plazo. `signal` cancela desde fuera (se propaga como AbortError); si se
 * agota el plazo o el servicio no responde se lanza un Error con un mensaje para el usuario.
 */
export async function fetchExternal(url, { fetchImpl, signal, timeoutMs, headers }, read) {
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener?.("abort", abort);
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    try {
        let response;
        try {
            // Sin credenciales: el servicio es externo y no debe recibir cookies del sitio.
            response = await fetchImpl(url, {
                ...(headers ? { headers } : {}),
                credentials: "omit",
                signal: controller.signal,
            });
        } catch (error) {
            if (error?.name === "AbortError") throw error;
            // El navegador entrega el mismo error para una falla de red y para un bloqueo por CORS.
            throw new Error(NO_RESPONSE_MESSAGE, { cause: error });
        }
        return await read(response);
    } catch (error) {
        if (timedOut) throw new Error(REQUEST_TIMEOUT_MESSAGE);
        throw error;
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener?.("abort", abort);
    }
}

/**
 * Convierte un documento XML en un árbol simple `{ name, attrs, children, text }`, con nombres
 * locales (sin prefijo de espacio de nombres). Devuelve null si el XML no es válido.
 */
export function parseXmlToTree(text, DOMParserImpl = globalThis.DOMParser) {
    if (typeof text !== "string" || !text.trim() || typeof DOMParserImpl !== "function") return null;
    const doc = new DOMParserImpl().parseFromString(text, "application/xml");
    if (!doc?.documentElement || doc.getElementsByTagName("parsererror").length) return null;
    return elementToTree(doc.documentElement);
}

function elementToTree(element) {
    const children = Array.from(element.children || []).map(elementToTree);
    return {
        name: element.localName,
        attrs: Object.fromEntries(Array.from(element.attributes || []).map((attribute) => [attribute.localName, attribute.value])),
        children,
        text: children.length ? "" : element.textContent || "",
    };
}

export const childrenNamed = (node, name) => (node?.children || []).filter((child) => child.name === name);
export const childNamed = (node, name) => childrenNamed(node, name)[0] || null;
export const childText = (node, name) => (childNamed(node, name)?.text || "").trim();

/** Nodos `Get` (DCP › HTTP › Get) de la operación `operationName` en `OperationsMetadata` (OWS Common). */
export function operationGetRequests(root, operationName) {
    const operations = childrenNamed(childNamed(root, "OperationsMetadata"), "Operation");
    const operation = operations.find((candidate) => candidate.attrs?.name === operationName);
    return childrenNamed(operation, "DCP").flatMap((dcp) => childrenNamed(childNamed(dcp, "HTTP"), "Get"));
}

/**
 * Devuelve la URL absoluta si el navegador puede cargarla desde esta página, o null.
 * Un `http://` en una página `https` se bloquea por contenido mixto; si apunta a `secureHost`
 * (el host de la URL https configurada para el servicio) se pasa a `https`, porque ese host
 * ya demostró servir https.
 */
export function loadableUrl(href, base, pageProtocol, secureHost = null) {
    let url;
    try {
        url = new URL(href, base);
    } catch {
        return null;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    if (url.protocol === "http:" && pageProtocol === "https:") {
        if (!secureHost || url.host !== secureHost) return null;
        url.protocol = "https:";
    }
    return url.toString();
}

/** Host de una URL https, para autorizar el paso de http a https en ese mismo host. */
export function secureHostOf(serviceUrl) {
    try {
        const url = new URL(serviceUrl);
        return url.protocol === "https:" ? url.host : null;
    } catch {
        return null;
    }
}

/**
 * Crea un lector de GetCapabilities sin credenciales, con tiempo y tamaño máximos. `load(url)`
 * devuelve `{ root }` con el árbol del documento o `{ error }` con la causa para el usuario
 * (estado HTTP, tiempo, tamaño, XML inválido, o sin respuesta por red o CORS). Un documento
 * leído se guarda y no se vuelve a pedir; uno que falló se pide de nuevo en la siguiente llamada.
 */
export function createCapabilitiesLoader({
    fetchImpl = globalThis.fetch?.bind(globalThis),
    parseXml = parseXmlToTree,
    timeoutMs = CAPABILITIES_TIMEOUT_MS,
    maxBytes = MAX_CAPABILITIES_BYTES,
} = {}) {
    const cache = new Map();
    const tooLarge = { error: `El GetCapabilities del servicio supera los ${Math.round(maxBytes / (1024 * 1024))} MB.` };

    async function fetchCapabilities(url) {
        if (typeof fetchImpl !== "function") return { error: "El navegador no permite consultar el servicio." };
        try {
            return await fetchExternal(url, { fetchImpl, timeoutMs }, async (response) => {
                if (!response?.ok) return { error: `El servicio respondió con el estado ${response?.status ?? "desconocido"}.` };
                const declaredLength = Number(response.headers?.get?.("content-length"));
                if (declaredLength > maxBytes) return tooLarge;
                const text = await response.text();
                if (text.length > maxBytes) return tooLarge;
                const root = parseXml(text);
                return root ? { root } : { error: "El GetCapabilities del servicio no es un XML válido." };
            });
        } catch (error) {
            return { error: error?.message || NO_RESPONSE_MESSAGE };
        }
    }

    function load(url) {
        if (!cache.has(url)) {
            const pending = fetchCapabilities(url).then((result) => {
                // Solo se guarda lo leído: así apagar y encender la capa reintenta un servicio que falló.
                if (!result.root) cache.delete(url);
                return result;
            });
            cache.set(url, pending);
        }
        return cache.get(url);
    }

    return { load };
}
