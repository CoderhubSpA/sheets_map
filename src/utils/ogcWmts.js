// Capas de servicios WMTS externos según OGC 07-057r7 (WMTS 1.0.0).
import { childNamed, childrenNamed, childText, loadableUrl, secureHostOf } from "./ogcCapabilities.js";
import { ogcServiceUrl } from "./ogcWms.js";

export const OGC_WMTS_1_0_0_VERSION = "1.0.0";

// Parámetros que arma el cliente; si vienen en la URL configurada se quitan.
const WMTS_CLIENT_PARAMS = [
    "service",
    "request",
    "version",
    "layer",
    "style",
    "format",
    "tilematrixset",
    "tilematrix",
    "tilerow",
    "tilecol",
];

// Grilla del visor: EPSG:3857 con teselas de 256 px, la del conjunto bien conocido
// GoogleMapsCompatible (OGC 07-057r7, anexo E.4). El nivel z tiene escala 559082264.0287178 / 2^z.
const ZOOM_0_SCALE_DENOMINATOR = 559082264.0287178;
const WEB_MERCATOR_EDGE = 20037508.3427892;
const WEB_MERCATOR_CODES = new Set(["3857", "900913", "102100", "102113", "3785"]);
const MAX_ZOOM = 30;
const TILE_SIZE = 256;

const TEMPLATE_VARIABLE = /\{([^{}]+)\}/g;
const HAS_TEMPLATE_VARIABLE = /\{[^{}]+\}/;

export function ogcWmtsServiceUrl(rawUrl, pageProtocol) {
    return ogcServiceUrl(rawUrl, pageProtocol, { service: "WMTS", clientParams: WMTS_CLIENT_PARAMS });
}

/** URL del GetCapabilities: el documento RESTful (`.xml`) tal cual o la petición KVP. */
export function wmtsCapabilitiesUrl(serviceUrl) {
    const url = new URL(serviceUrl);
    if (/\.xml$/i.test(url.pathname)) return url.toString();
    url.searchParams.set("SERVICE", "WMTS");
    url.searchParams.set("REQUEST", "GetCapabilities");
    url.searchParams.set("VERSION", OGC_WMTS_1_0_0_VERSION);
    return url.toString();
}

/**
 * Arma la petición de una capa `operative_ogc_wmts_1_0_0` a partir de las columnas de «Mapa tiene
 * capas». Devuelve `{ serviceUrl, capabilitiesUrl, layerId, preferredFormat }` o `{ error }`.
 */
export function ogcWmtsLayerRequest(layer, pageProtocol) {
    const service = ogcWmtsServiceUrl(layer?.sh_map_has_layer_url, pageProtocol);
    if (service.error) return { error: service.error };

    const layerId = String(layer?.sh_map_has_layer_geoserver_layer ?? "").trim();
    if (!layerId) return { error: "La capa no tiene el identificador de la capa del servicio WMTS." };

    return {
        serviceUrl: service.url,
        capabilitiesUrl: wmtsCapabilitiesUrl(service.url),
        layerId,
        preferredFormat: String(layer?.sh_map_has_layer_wms_format ?? "").trim() || null,
    };
}

function isWebMercator(crs) {
    const code = /(\d+)\s*$/.exec(crs || "");
    return Boolean(code && WEB_MERCATOR_CODES.has(code[1]));
}

/**
 * Devuelve `{ zoom: identificador de TileMatrix }` con los niveles del TileMatrixSet que calzan
 * con la grilla del visor, o null si ninguno calza. Se compara la geometría (CRS, escala,
 * esquina superior izquierda y tamaño de tesela), no el nombre del conjunto.
 */
export function compatibleMatrixIds(tileMatrixSet) {
    if (!isWebMercator(childText(tileMatrixSet, "SupportedCRS"))) return null;

    const ids = {};
    for (const matrix of childrenNamed(tileMatrixSet, "TileMatrix")) {
        const scale = Number(childText(matrix, "ScaleDenominator"));
        const [x, y] = childText(matrix, "TopLeftCorner").split(/\s+/).map(Number);
        const width = Number(childText(matrix, "TileWidth"));
        const height = Number(childText(matrix, "TileHeight"));
        if (!(scale > 0) || width !== TILE_SIZE || height !== TILE_SIZE) continue;
        if (Math.abs(x + WEB_MERCATOR_EDGE) > 1 || Math.abs(y - WEB_MERCATOR_EDGE) > 1) continue;

        const zoom = Math.log2(ZOOM_0_SCALE_DENOMINATOR / scale);
        const level = Math.round(zoom);
        if (Math.abs(zoom - level) > 1e-4 || level < 0 || level > MAX_ZOOM) continue;
        ids[level] = childText(matrix, "Identifier");
    }
    return Object.keys(ids).length ? ids : null;
}

function encodeValue(value) {
    // Los «:» son válidos en rutas y consultas, y varios servidores esperan identificadores como EPSG:3857:5.
    return encodeURIComponent(String(value)).replace(/%3A/gi, ":");
}

/** Reemplaza las variables `{Nombre}` de una plantilla (sin distinguir mayúsculas) que estén en `values`. */
export function fillTemplate(template, values) {
    return template.replace(TEMPLATE_VARIABLE, (match, name) => {
        const key = name.toLowerCase();
        return Object.prototype.hasOwnProperty.call(values, key) ? encodeValue(values[key]) : match;
    });
}

/** Valida una plantilla absoluta y, si corresponde, la pasa de http a https. Devuelve null si no sirve. */
function secureTemplate(template, base, pageProtocol, secureHost) {
    if (!/^https?:\/\//i.test(template)) return null;
    const probe = fillTemplate(template, { tilematrix: "0", tilerow: "0", tilecol: "0" });
    if (HAS_TEMPLATE_VARIABLE.test(probe)) return null;
    const loadable = loadableUrl(probe, base, pageProtocol, secureHost);
    if (!loadable) return null;
    return /^http:/i.test(template) && loadable.startsWith("https:") ? template.replace(/^http:/i, "https:") : template;
}

function kvpGetTileHref(root) {
    const operations = childrenNamed(childNamed(root, "OperationsMetadata"), "Operation");
    const getTile = operations.find((operation) => operation.attrs?.name === "GetTile");
    for (const dcp of childrenNamed(getTile, "DCP")) {
        for (const get of childrenNamed(childNamed(dcp, "HTTP"), "Get")) {
            const encodings = childrenNamed(get, "Constraint")
                .filter((constraint) => constraint.attrs?.name === "GetEncoding")
                .flatMap((constraint) => childrenNamed(childNamed(constraint, "AllowedValues"), "Value"))
                .map((value) => value.text.trim().toUpperCase());
            if (get.attrs?.href && (!encodings.length || encodings.includes("KVP"))) return get.attrs.href;
        }
    }
    return null;
}

/**
 * Resuelve, desde el GetCapabilities ya convertido en árbol, cómo pedir las teselas de la capa.
 * Devuelve `{ template, matrixIds, minNativeZoom, maxNativeZoom, legendHref }` o `{ error }`.
 * `template` deja pendientes `{TileMatrix}`, `{TileRow}` y `{TileCol}`.
 */
export function resolveWmtsLayer(root, { layerId, preferredFormat, capabilitiesUrl, serviceUrl, pageProtocol }) {
    const contents = childNamed(root, "Contents");
    const layer = childrenNamed(contents, "Layer").find((node) => childText(node, "Identifier") === layerId);
    if (!layer) return { error: `El servicio WMTS no publica la capa «${layerId}».` };

    const formats = childrenNamed(layer, "Format").map((node) => node.text.trim()).filter(Boolean);
    const format = [preferredFormat, "image/png", formats[0]].find((candidate) => candidate && formats.includes(candidate))
        || formats[0]
        || "image/png";

    const styles = childrenNamed(layer, "Style");
    const style = styles.find((node) => String(node.attrs?.isDefault).toLowerCase() === "true") || styles[0];
    const styleId = (style && childText(style, "Identifier")) || "default";
    const legendHref = style
        ? childrenNamed(style, "LegendURL").map((node) => node.attrs?.href?.trim()).find(Boolean) || null
        : null;

    // Las dimensiones (por ejemplo, Time) usan su valor por defecto.
    const dimensions = {};
    for (const dimension of childrenNamed(layer, "Dimension")) {
        const id = childText(dimension, "Identifier");
        const value = childText(dimension, "Default") || childText(dimension, "Value");
        if (id && value) dimensions[id] = value;
    }

    const tileMatrixSets = new Map(
        childrenNamed(contents, "TileMatrixSet").map((set) => [childText(set, "Identifier"), set]),
    );
    let best = null;
    for (const link of childrenNamed(layer, "TileMatrixSetLink")) {
        const id = childText(link, "TileMatrixSet");
        const matrixIds = tileMatrixSets.has(id) ? compatibleMatrixIds(tileMatrixSets.get(id)) : null;
        const levels = matrixIds ? Object.keys(matrixIds).length : 0;
        if (levels && (!best || levels > best.levels)) best = { id, matrixIds, levels, link };
    }
    if (!best) {
        return { error: "El servicio WMTS no ofrece la capa en una grilla compatible con el visor (EPSG:3857, teselas de 256 px)." };
    }

    const secureHost = secureHostOf(serviceUrl);
    const staticValues = { tilematrixset: best.id, style: styleId };
    for (const [id, value] of Object.entries(dimensions)) staticValues[id.toLowerCase()] = value;

    let template = null;
    for (const resource of childrenNamed(layer, "ResourceURL")) {
        if (String(resource.attrs?.resourceType).toLowerCase() !== "tile" || resource.attrs?.format !== format) continue;
        const filled = fillTemplate(resource.attrs.template || "", staticValues);
        template = secureTemplate(filled, capabilitiesUrl, pageProtocol, secureHost);
        if (template) break;
    }

    if (!template) {
        const href = kvpGetTileHref(root) || (/\.xml$/i.test(new URL(serviceUrl).pathname) ? null : serviceUrl);
        if (href) {
            const url = new URL(href, capabilitiesUrl);
            const params = {
                SERVICE: "WMTS",
                REQUEST: "GetTile",
                VERSION: OGC_WMTS_1_0_0_VERSION,
                LAYER: layerId,
                STYLE: styleId,
                FORMAT: format,
                TILEMATRIXSET: best.id,
            };
            for (const [id, value] of Object.entries(dimensions)) params[id.toUpperCase()] = value;
            for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
            const kvp = `${url.toString()}&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}`;
            template = secureTemplate(kvp, capabilitiesUrl, pageProtocol, secureHost);
        }
    }
    if (!template) return { error: "El servicio WMTS no indica una forma de pedir teselas que el navegador pueda usar." };

    const zooms = Object.keys(best.matrixIds).map(Number);
    return {
        template,
        matrixIds: best.matrixIds,
        limits: tileMatrixLimits(best.link, best.matrixIds),
        minNativeZoom: Math.min(...zooms),
        maxNativeZoom: Math.max(...zooms),
        legendHref: legendHref ? loadableUrl(legendHref, capabilitiesUrl, pageProtocol, secureHost) : null,
    };
}

/**
 * Lee los `TileMatrixSetLimits` del enlace de la capa: las filas y columnas que el servicio tiene
 * en cada nivel. Devuelve `{ zoom: { minRow, maxRow, minCol, maxCol } }`; vacío si no los publica.
 */
export function tileMatrixLimits(link, matrixIds) {
    const zoomByMatrix = new Map(Object.entries(matrixIds).map(([zoom, id]) => [id, Number(zoom)]));
    const limits = {};
    for (const limit of childrenNamed(childNamed(link, "TileMatrixSetLimits"), "TileMatrixLimits")) {
        const zoom = zoomByMatrix.get(childText(limit, "TileMatrix"));
        const values = ["MinTileRow", "MaxTileRow", "MinTileCol", "MaxTileCol"].map((name) => Number(childText(limit, name)));
        if (zoom === undefined || values.some((value) => !Number.isInteger(value))) continue;
        const [minRow, maxRow, minCol, maxCol] = values;
        limits[zoom] = { minRow, maxRow, minCol, maxCol };
    }
    return limits;
}

/**
 * URL de la tesela `{ x, y, z }` del visor; vacía si el servicio no tiene ese nivel o la tesela
 * queda fuera de sus `TileMatrixSetLimits` (el servidor respondería TileOutOfRange).
 */
export function wmtsTileUrl(config, { x, y, z }) {
    const matrix = config?.matrixIds?.[z];
    if (matrix === undefined) return "";
    const limit = config.limits?.[z];
    if (limit && (y < limit.minRow || y > limit.maxRow || x < limit.minCol || x > limit.maxCol)) return "";
    return fillTemplate(config.template, { tilematrix: matrix, tilerow: y, tilecol: x });
}
