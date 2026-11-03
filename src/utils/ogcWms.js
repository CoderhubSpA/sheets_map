// Capas de servicios WMS externos según OGC 06-042 (WMS 1.3.0, ISO 19128).
import { ogcServiceUrl } from "./ogcCapabilities.js";

export const OGC_WMS_1_3_0_VERSION = "1.3.0";

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
        format: String(layer?.sh_map_has_layer_wms_format ?? "").trim() || "image/png",
        version: OGC_WMS_1_3_0_VERSION,
    };
}
