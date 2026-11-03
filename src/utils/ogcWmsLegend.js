// Leyendas de capas WMS 1.3.0 externas según OGC 06-042: el `LegendURL` del estilo de la capa
// en GetCapabilities y, como alternativa, `GetLegendGraphic` del perfil SLD de WMS (OGC 05-078r4).
import { OGC_WMS_1_3_0_VERSION, wmsLayerNames } from "./ogcWms.js";
import {
    childNamed,
    childrenNamed,
    childText,
    createCapabilitiesLoader,
    DEFAULT_IMAGE_FORMAT,
    loadableUrl,
    secureHostOf,
} from "./ogcCapabilities.js";

// Versión del perfil SLD de WMS para GetLegendGraphic (OGC 05-078r4).
const SLD_VERSION = "1.1.0";

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
    url.searchParams.set("FORMAT", DEFAULT_IMAGE_FORMAT);
    url.searchParams.set("LAYER", layerName);
    url.searchParams.set("SLD_VERSION", SLD_VERSION);
    return url.toString();
}

export function capabilitiesUrl(baseUrl) {
    const url = new URL(baseUrl);
    url.searchParams.set("SERVICE", "WMS");
    url.searchParams.set("REQUEST", "GetCapabilities");
    url.searchParams.set("VERSION", OGC_WMS_1_3_0_VERSION);
    return url.toString();
}

/**
 * URLs de imagen de leyenda de las capas de `config.layers` a partir del GetCapabilities ya leído
 * (`root`); si no se pudo leer (`root` null) se usa GetLegendGraphic. Lista vacía si el servicio no
 * publica leyenda.
 */
export function wmsLegendUrls(root, config, pageProtocol) {
    if (!config?.baseUrl || !config?.layers) return [];
    const url = capabilitiesUrl(config.baseUrl);
    const secureHost = secureHostOf(config.baseUrl);

    const legends = wmsLayerNames(config.layers).map((layerName) => {
        // Si el GetCapabilities no se pudo leer (por ejemplo, sin CORS), se intenta GetLegendGraphic:
        // una imagen no necesita CORS y, si el servidor no lo soporta, la leyenda se oculta al fallar.
        if (!root) return [getLegendGraphicUrl(config.baseUrl, layerName)];
        const info = legendFromCapabilities(root, layerName);
        return [
            info.legendHref,
            info.supportsGetLegendGraphic ? getLegendGraphicUrl(config.baseUrl, layerName) : null,
        ];
    });

    return legends
        .map((candidates) => candidates
            .filter(Boolean)
            .map((href) => loadableUrl(href, url, pageProtocol, secureHost))
            .find(Boolean))
        .filter(Boolean);
}

/**
 * Crea un resolutor de leyendas WMS. `resolve(config, pageProtocol)` lee el GetCapabilities con
 * el `loader` (compartido, para leer cada servicio una sola vez) y devuelve `wmsLegendUrls`.
 */
export function createOgcWmsLegendResolver({
    fetchImpl,
    parseXml,
    timeoutMs,
    loader = createCapabilitiesLoader({ fetchImpl, parseXml, timeoutMs }),
} = {}) {
    async function resolve(config, pageProtocol) {
        if (!config?.baseUrl || !config?.layers) return [];
        const { root } = await loader.load(capabilitiesUrl(config.baseUrl));
        return wmsLegendUrls(root, config, pageProtocol);
    }

    return { resolve };
}
