// Capas de servicios WMS externos según OGC 06-042 (WMS 1.3.0, ISO 19128).

export const OGC_WMS_1_3_0_VERSION = "1.3.0";

// Parámetros que el cliente arma en cada GetMap. Si vienen en la URL configurada
// (por ejemplo, al pegar la URL de GetCapabilities) se quitan para no enviarlos duplicados.
// Los parámetros propios del servidor, como `map` de MapServer, se conservan.
const CLIENT_MANAGED_PARAMS = new Set([
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
]);

/**
 * Normaliza la URL de un servicio WMS externo. Devuelve `{ url }` o `{ error }` con un
 * mensaje para el usuario.
 */
export function ogcWmsServiceUrl(rawUrl, pageProtocol) {
    const value = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!value) return { error: "La capa no tiene la URL del servicio WMS." };

    let url;
    try {
        url = new URL(value);
    } catch {
        return { error: "La URL del servicio WMS no es válida." };
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        return { error: "La URL del servicio WMS debe usar https." };
    }
    // El navegador bloquea contenido http dentro de un sitio https.
    if (url.protocol === "http:" && pageProtocol === "https:") {
        return { error: "El servicio WMS usa http y el navegador lo bloquea en un sitio https." };
    }
    if (url.username || url.password) {
        return { error: "La URL del servicio WMS no puede incluir credenciales." };
    }

    for (const key of Array.from(url.searchParams.keys())) {
        if (CLIENT_MANAGED_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    url.hash = "";

    return { url: url.toString() };
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
