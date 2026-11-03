// Capas de servicios WMS externos según OGC 06-042 (WMS 1.3.0, ISO 19128).
import { childrenNamed, childText, DEFAULT_IMAGE_FORMAT, ogcServiceUrl } from "./ogcCapabilities.js";

export const OGC_WMS_1_3_0_VERSION = "1.3.0";
// CRS de las imágenes que pide el visor (Leaflet en Web Mercator).
const WMS_REQUEST_CRS = "EPSG:3857";

// Parámetros que el cliente arma en cada GetMap. Si vienen en la URL configurada
// (por ejemplo, al pegar la URL de GetCapabilities) se quitan para no enviarlos duplicados.
// Los parámetros propios del servidor, como `map` de MapServer, se conservan.
const WMS_CLIENT_PARAMS = [
    "service",
    "request",
    "version",
    "layers",
    "styles",
    "crs",
    "srs",
    "bbox",
    "width",
    "height",
    "format",
    "transparent",
];

/** Nombres de las capas de `LAYERS` («a, b» → ["a", "b"]). */
export function wmsLayerNames(layers) {
    return String(layers ?? "").split(",").map((name) => name.trim()).filter(Boolean);
}

export function ogcWmsServiceUrl(rawUrl, pageProtocol) {
    return ogcServiceUrl(rawUrl, pageProtocol, { service: "WMS", clientParams: WMS_CLIENT_PARAMS });
}

/**
 * Arma la configuración de una capa `operative_ogc_wms_1_3_0` a partir de las columnas de
 * «Mapa tiene capas». Devuelve `{ baseUrl, layers, format, version }` o `{ error }`.
 */
export function ogcWmsLayerConfig(layer, pageProtocol) {
    const service = ogcWmsServiceUrl(layer?.sh_map_has_layer_url, pageProtocol);
    if (service.error) return { error: service.error };

    const layers = String(layer?.sh_map_has_layer_geoserver_layer ?? "").trim();
    if (!layers) return { error: "La capa no tiene el nombre de la capa del servicio WMS." };

    return {
        baseUrl: service.url,
        layers,
        format: String(layer?.sh_map_has_layer_wms_format ?? "").trim() || DEFAULT_IMAGE_FORMAT,
        version: OGC_WMS_1_3_0_VERSION,
    };
}

/**
 * CRS que anuncia la capa `layerName` en un GetCapabilities WMS 1.3.0, sumando los que hereda de
 * sus capas padre (OGC 06-042, 7.2.4.8). Devuelve null si el servicio no publica la capa.
 */
export function wmsLayerCrs(root, layerName) {
    const stack = [{ node: root, inheritedCrs: [] }];
    while (stack.length) {
        const { node, inheritedCrs } = stack.pop();
        const crs = node.name === "Layer"
            ? [...inheritedCrs, ...childrenNamed(node, "CRS").map((child) => child.text.trim())]
            : inheritedCrs;
        if (node.name === "Layer" && childText(node, "Name") === layerName) return crs;
        for (const child of node.children || []) stack.push({ node: child, inheritedCrs: crs });
    }
    return null;
}

/**
 * Revisa en el GetCapabilities que el servicio publique las capas de `layers` en EPSG:3857.
 * Devuelve un aviso para el usuario o null. No impide la carga: hay servidores que dibujan en
 * EPSG:3857 aunque no lo anuncien.
 */
export function ogcWmsCapabilitiesWarning(root, layers) {
    for (const layerName of wmsLayerNames(layers)) {
        const crs = wmsLayerCrs(root, layerName);
        if (!crs) return `El servicio WMS no publica la capa «${layerName}»; puede que no se dibuje.`;
        if (!crs.some((code) => code.toUpperCase() === WMS_REQUEST_CRS)) {
            return `El servicio WMS no anuncia ${WMS_REQUEST_CRS} para la capa «${layerName}»; `
                + "el visor pide las imágenes en ese sistema y puede que no se dibujen.";
        }
    }
    return null;
}
