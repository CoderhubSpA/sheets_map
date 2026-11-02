// Leyendas de capas WMS 1.3.0 externas según OGC 06-042: el `LegendURL` del estilo de la capa
// en GetCapabilities y, como alternativa, `GetLegendGraphic` del perfil SLD de WMS (OGC 05-078r4).
import { OGC_WMS_1_3_0_VERSION } from "./ogcWms.js";

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

const childrenNamed = (node, name) => (node?.children || []).filter((child) => child.name === name);
const childNamed = (node, name) => childrenNamed(node, name)[0] || null;
const childText = (node, name) => (childNamed(node, name)?.text || "").trim();

/** Busca la capa por su `Name` y devuelve sus estilos propios seguidos de los heredados. */
function findLayerStyles(root, layerName) {
    const stack = [{ node: root, inheritedStyles: [] }];
    while (stack.length) {
        const { node, inheritedStyles } = stack.pop();
        const styles = node.name === "Layer"
            ? [...childrenNamed(node, "Style"), ...inheritedStyles]
            : inheritedStyles;
        if (node.name === "Layer" && childText(node, "Name") === layerName) return styles;
        for (const child of node.children || []) stack.push({ node: child, inheritedStyles: styles });
    }
    return null;
}

function styleLegendHref(style) {
    for (const legend of childrenNamed(style, "LegendURL")) {
        const href = childNamed(legend, "OnlineResource")?.attrs?.href;
        if (href && href.trim()) return href.trim();
    }
    return null;
}

/**
 * Lee de un GetCapabilities ya convertido en árbol la leyenda de una capa. Devuelve
 * `{ found, legendHref, supportsGetLegendGraphic }`.
 */
export function legendFromCapabilities(root, layerName) {
    const request = childNamed(childNamed(root, "Capability"), "Request");
    const supportsGetLegendGraphic = Boolean(childNamed(request, "GetLegendGraphic"));
    const styles = findLayerStyles(root, layerName);
    if (!styles) return { found: false, legendHref: null, supportsGetLegendGraphic };

    // Sin STYLES en GetMap el servidor usa su estilo por defecto: el llamado «default» o el primero.
    const ordered = [
        ...styles.filter((style) => childText(style, "Name").toLowerCase() === "default"),
        ...styles,
    ];
    const legendHref = ordered.map(styleLegendHref).find(Boolean) || null;
    return { found: true, legendHref, supportsGetLegendGraphic };
}

export function getLegendGraphicUrl(baseUrl, layerName) {
    const url = new URL(baseUrl);
    url.searchParams.set("SERVICE", "WMS");
    url.searchParams.set("REQUEST", "GetLegendGraphic");
    url.searchParams.set("VERSION", OGC_WMS_1_3_0_VERSION);
    url.searchParams.set("FORMAT", "image/png");
    url.searchParams.set("LAYER", layerName);
    url.searchParams.set("SLD_VERSION", "1.1.0");
    return url.toString();
}

export function capabilitiesUrl(baseUrl) {
    const url = new URL(baseUrl);
    url.searchParams.set("SERVICE", "WMS");
    url.searchParams.set("REQUEST", "GetCapabilities");
    url.searchParams.set("VERSION", OGC_WMS_1_3_0_VERSION);
    return url.toString();
}

/** Devuelve la URL absoluta si el navegador puede cargarla como imagen en esta página. */
export function loadableImageUrl(href, base, pageProtocol) {
    let url;
    try {
        url = new URL(href, base);
    } catch {
        return null;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.protocol === "http:" && pageProtocol === "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
}

/**
 * Crea un resolutor de leyendas que lee el GetCapabilities de cada servicio una sola vez.
 * `resolve(config, pageProtocol)` devuelve las URLs de imagen de leyenda de las capas de
 * `config.layers`; una lista vacía si el servicio no publica leyenda.
 */
export function createOgcWmsLegendResolver({
    fetchImpl = globalThis.fetch?.bind(globalThis),
    parseXml = parseXmlToTree,
    timeoutMs = CAPABILITIES_TIMEOUT_MS,
} = {}) {
    const capabilitiesCache = new Map();

    async function fetchCapabilities(url) {
        if (typeof fetchImpl !== "function") return null;
        const controller = typeof AbortController === "function" ? new AbortController() : null;
        const timer = setTimeout(() => controller?.abort(), timeoutMs);
        try {
            // Sin credenciales: el servicio es externo y no debe recibir cookies del sitio.
            const response = await fetchImpl(url, { credentials: "omit", signal: controller?.signal });
            if (!response?.ok) return null;
            const declaredLength = Number(response.headers?.get?.("content-length"));
            if (declaredLength > MAX_CAPABILITIES_BYTES) return null;
            const text = await response.text();
            if (text.length > MAX_CAPABILITIES_BYTES) return null;
            return parseXml(text);
        } catch {
            return null;
        } finally {
            clearTimeout(timer);
        }
    }

    function loadCapabilities(url) {
        if (!capabilitiesCache.has(url)) capabilitiesCache.set(url, fetchCapabilities(url));
        return capabilitiesCache.get(url);
    }

    async function resolve(config, pageProtocol) {
        if (!config?.baseUrl || !config?.layers) return [];
        const url = capabilitiesUrl(config.baseUrl);
        const capabilities = await loadCapabilities(url);
        const layerNames = config.layers.split(",").map((name) => name.trim()).filter(Boolean);

        const legends = layerNames.map((layerName) => {
            // Si el GetCapabilities no se pudo leer (por ejemplo, sin CORS), se intenta GetLegendGraphic:
            // una imagen no necesita CORS y, si el servidor no lo soporta, la leyenda se oculta al fallar.
            if (!capabilities) return [getLegendGraphicUrl(config.baseUrl, layerName)];
            const info = legendFromCapabilities(capabilities, layerName);
            return [
                info.legendHref,
                info.supportsGetLegendGraphic ? getLegendGraphicUrl(config.baseUrl, layerName) : null,
            ];
        });

        return legends
            .map((candidates) => candidates
                .filter(Boolean)
                .map((href) => loadableImageUrl(href, url, pageProtocol))
                .find(Boolean))
            .filter(Boolean);
    }

    return { resolve };
}
