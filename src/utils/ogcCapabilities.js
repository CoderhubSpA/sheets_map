// Lectura de documentos GetCapabilities de servicios OGC externos (WMS, WMTS) en el navegador.

const CAPABILITIES_TIMEOUT_MS = 15000;
const MAX_CAPABILITIES_BYTES = 10 * 1024 * 1024;

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
        attrs: Object.fromEntries(Array.from(element.attributes || []).map((a) => [a.localName, a.value])),
        children,
        text: children.length ? "" : element.textContent || "",
    };
}

export const childrenNamed = (node, name) => (node?.children || []).filter((child) => child.name === name);
export const childNamed = (node, name) => childrenNamed(node, name)[0] || null;
export const childText = (node, name) => (childNamed(node, name)?.text || "").trim();

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
 * Crea un lector de GetCapabilities que pide cada URL una sola vez, sin credenciales, con
 * tiempo y tamaño máximos. `load(url)` devuelve el árbol del documento o null si no se pudo
 * leer (red, CORS, tiempo, tamaño o XML inválido).
 */
export function createCapabilitiesLoader({
    fetchImpl = globalThis.fetch?.bind(globalThis),
    parseXml = parseXmlToTree,
    timeoutMs = CAPABILITIES_TIMEOUT_MS,
    maxBytes = MAX_CAPABILITIES_BYTES,
} = {}) {
    const cache = new Map();

    async function fetchCapabilities(url) {
        if (typeof fetchImpl !== "function") return null;
        const controller = typeof AbortController === "function" ? new AbortController() : null;
        const timer = setTimeout(() => controller?.abort(), timeoutMs);
        try {
            // Sin credenciales: el servicio es externo y no debe recibir cookies del sitio.
            const response = await fetchImpl(url, { credentials: "omit", signal: controller?.signal });
            if (!response?.ok) return null;
            const declaredLength = Number(response.headers?.get?.("content-length"));
            if (declaredLength > maxBytes) return null;
            const text = await response.text();
            if (text.length > maxBytes) return null;
            return parseXml(text);
        } catch {
            return null;
        } finally {
            clearTimeout(timer);
        }
    }

    function load(url) {
        if (!cache.has(url)) cache.set(url, fetchCapabilities(url));
        return cache.get(url);
    }

    return { load };
}
