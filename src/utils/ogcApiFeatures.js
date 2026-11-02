// Colecciones de OGC API – Features – Part 1: Core 1.0 (OGC 17-069r4), lo que antes se llamaba WFS 3.0.
import { ogcServiceUrl } from "./ogcWms.js";

export const OGC_API_FEATURES_PAGE_LIMIT = 500;
export const OGC_API_FEATURES_MAX_FEATURES = 2000;

const REQUEST_TIMEOUT_MS = 20000;
// Parámetros que arma el cliente; si vienen en la URL configurada se quitan.
const FEATURES_CLIENT_PARAMS = ["bbox", "bbox-crs", "crs", "limit", "offset", "f"];
// El estándar define GeoJSON como application/geo+json; algunos servidores solo anuncian application/json.
const GEOJSON_ACCEPT = "application/geo+json, application/json;q=0.9";

/**
 * Arma la URL de los elementos (`/collections/{id}/items`) de una capa
 * `operative_ogc_api_features_1_0`. `layer_url` puede ser la página de inicio de la API, la de la
 * colección o la de sus elementos; `gen_geoserver_layer` es el identificador de la colección.
 * Devuelve `{ itemsUrl, collectionId }` o `{ error }`.
 */
export function ogcFeaturesLayerConfig(layer, pageProtocol) {
    const service = ogcServiceUrl(layer?.sh_map_has_layer_url, pageProtocol, {
        service: "OGC API Features",
        clientParams: FEATURES_CLIENT_PARAMS,
    });
    if (service.error) return { error: service.error };

    const url = new URL(service.url);
    const configured = String(layer?.sh_map_has_layer_geoserver_layer ?? "").trim();
    const match = /^(.*?)\/collections\/([^/]+)(?:\/items)?\/?$/.exec(url.pathname);
    let landingPath = url.pathname.replace(/\/+$/, "");
    let collectionId = configured;
    if (match) {
        landingPath = match[1];
        const fromUrl = decodeURIComponent(match[2]);
        if (configured && configured !== fromUrl) {
            return { error: `La URL apunta a la colección «${fromUrl}», pero la capa indica «${configured}».` };
        }
        collectionId = fromUrl;
    }
    if (!collectionId) return { error: "La capa no tiene el identificador de la colección de OGC API Features." };

    url.pathname = `${landingPath}/collections/${encodeURIComponent(collectionId)}/items`;
    return { itemsUrl: url.toString(), collectionId };
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round6 = (value) => Math.round(value * 1e6) / 1e6;

/** bbox en CRS84 (lon/lat) recortado al mundo: Leaflet puede entregar longitudes fuera de ±180. */
export function crs84Bbox({ west, south, east, north }) {
    if (east - west >= 360) return [-180, round6(clamp(south, -90, 90)), 180, round6(clamp(north, -90, 90))];
    return [
        round6(clamp(west, -180, 180)),
        round6(clamp(south, -90, 90)),
        round6(clamp(east, -180, 180)),
        round6(clamp(north, -90, 90)),
    ];
}

export function itemsPageUrl(itemsUrl, bbox, limit) {
    const url = new URL(itemsUrl);
    url.searchParams.set("bbox", bbox.join(","));
    url.searchParams.set("limit", String(limit));
    return url.toString();
}

/** Enlace `next` de la página, solo si apunta al mismo servidor. */
export function nextPageUrl(collection, currentUrl) {
    const link = (Array.isArray(collection?.links) ? collection.links : []).find(
        (candidate) => candidate?.rel === "next" && candidate.href && (!candidate.type || /json/i.test(candidate.type)),
    );
    if (!link) return null;
    let url;
    try {
        url = new URL(link.href, currentUrl);
    } catch {
        return null;
    }
    return url.origin === new URL(currentUrl).origin ? url.toString() : null;
}

async function fetchPage(url, { fetchImpl, signal, timeoutMs }) {
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
        // Sin credenciales: el servicio es externo y no debe recibir cookies del sitio.
        const response = await fetchImpl(url, {
            headers: { Accept: GEOJSON_ACCEPT },
            credentials: "omit",
            signal: controller.signal,
        });
        if (!response?.ok) throw new Error(`El servicio respondió con el estado ${response?.status ?? "desconocido"}.`);
        let body;
        try {
            body = await response.json();
        } catch {
            throw new Error("La respuesta del servicio no es JSON válido.");
        }
        if (body?.type !== "FeatureCollection" || !Array.isArray(body.features)) {
            throw new Error("La respuesta del servicio no es una colección GeoJSON.");
        }
        return body;
    } catch (error) {
        if (timedOut) throw new Error("El servicio tardó demasiado en responder.");
        throw error;
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener?.("abort", abort);
    }
}

/**
 * Pide los elementos de la vista y sigue los enlaces `next` hasta `maxFeatures`.
 * Devuelve `{ features, numberMatched, truncated }`; lanza un Error con un mensaje para el usuario
 * si el servicio falla, o un AbortError si se cancela con `signal`.
 */
export async function fetchFeaturesInView({
    itemsUrl,
    bbox,
    signal,
    fetchImpl = globalThis.fetch?.bind(globalThis),
    pageLimit = OGC_API_FEATURES_PAGE_LIMIT,
    maxFeatures = OGC_API_FEATURES_MAX_FEATURES,
    timeoutMs = REQUEST_TIMEOUT_MS,
}) {
    const features = [];
    let numberMatched = null;
    let truncated = false;
    let url = itemsPageUrl(itemsUrl, bbox, Math.min(pageLimit, maxFeatures));

    while (url) {
        const page = await fetchPage(url, { fetchImpl, signal, timeoutMs });
        if (numberMatched === null && Number.isFinite(page.numberMatched)) numberMatched = page.numberMatched;

        const room = maxFeatures - features.length;
        features.push(...page.features.slice(0, room));
        const next = nextPageUrl(page, url);
        if (features.length >= maxFeatures) {
            truncated = Boolean(next) || page.features.length > room;
            break;
        }
        url = next;
    }
    if (numberMatched !== null && numberMatched > features.length) truncated = true;

    return { features, numberMatched, truncated };
}
