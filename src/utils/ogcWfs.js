// Capas de servicios WFS 2.0 externos según OGC 09-025r2 (WFS 2.0.2, ISO 19142), con salida GeoJSON.
import {
    childNamed,
    childrenNamed,
    childText,
    clamp,
    crsCode,
    fetchExternal,
    isWebMercator,
    loadableUrl,
    ogcServiceUrl,
    operationGetRequests,
    roundCoordinate,
    secureHostOf,
} from "./ogcCapabilities.js";

export const OGC_WFS_MAX_FEATURES = 2000;

const REQUEST_TIMEOUT_MS = 20000;
// CRS que se pide cuando el tipo no anuncia uno usable: el servidor tendría que reproyectar.
const FALLBACK_SRS_NAME = "urn:ogc:def:crs:EPSG::3857";
const EARTH_RADIUS = 6378137;
const MAX_MERCATOR_LATITUDE = 85.05112878;
// Parámetros que arma el cliente; si vienen en la URL configurada se quitan.
const WFS_CLIENT_PARAMS = [
    "service",
    "request",
    "version",
    "acceptversions",
    "typename",
    "typenames",
    "outputformat",
    "srsname",
    "bbox",
    "count",
    "maxfeatures",
    "startindex",
];
// GML es la única salida obligatoria del estándar; GeoJSON depende del servidor y se anuncia con
// distintos nombres (GeoServer, MapServer, QGIS Server, deegree).
const JSON_FORMAT_PREFERENCE = [
    "application/geo+json",
    "application/json",
    "application/vnd.geo+json",
    "application/json; subtype=geojson",
];

export function ogcWfsServiceUrl(rawUrl, pageProtocol) {
    return ogcServiceUrl(rawUrl, pageProtocol, { service: "WFS", clientParams: WFS_CLIENT_PARAMS });
}

export function wfsCapabilitiesUrl(serviceUrl) {
    const url = new URL(serviceUrl);
    url.searchParams.set("SERVICE", "WFS");
    url.searchParams.set("REQUEST", "GetCapabilities");
    url.searchParams.set("ACCEPTVERSIONS", "2.0.2,2.0.0");
    return url.toString();
}

/**
 * Arma la petición de una capa `operative_ogc_wfs_2_0_2` a partir de las columnas de «Mapa tiene
 * capas». Devuelve `{ serviceUrl, capabilitiesUrl, typeName }` o `{ error }`.
 */
export function ogcWfsLayerRequest(layer, pageProtocol) {
    const service = ogcWfsServiceUrl(layer?.sh_map_has_layer_url, pageProtocol);
    if (service.error) return { error: service.error };

    const typeName = String(layer?.sh_map_has_layer_geoserver_layer ?? "").trim();
    if (!typeName) return { error: "La capa no tiene el nombre del tipo de elemento del servicio WFS." };

    return { serviceUrl: service.url, capabilitiesUrl: wfsCapabilitiesUrl(service.url), typeName };
}

const isCrs84 = (crs) => /CRS:?84$/i.test(String(crs || "").trim());

/**
 * Elige el CRS de la petición. EPSG:3857 no tiene ambigüedad de ejes; con EPSG:4326 el orden
 * depende de la forma del identificador y del servidor, así que la respuesta se revisa después.
 * Devuelve null si el tipo no anuncia Web Mercator ni un CRS geográfico.
 */
export function chooseWfsCrs(listedCrs) {
    const listed = listedCrs.map((crs) => String(crs || "").trim()).filter(Boolean);
    const mercator = listed.find(isWebMercator);
    if (mercator) return { srsName: mercator, kind: "mercator" };
    const crs84 = listed.find(isCrs84);
    if (crs84) return { srsName: crs84, kind: "lonlat" };
    const wgs84 = listed.find((crs) => crsCode(crs) === "4326");
    if (wgs84) {
        // Las formas URN y http://www.opengis.net/def/crs/ declaran latitud primero; «EPSG:4326» no.
        const latFirst = /^(urn:|https?:\/\/www\.opengis\.net\/def\/crs)/i.test(wgs84);
        return { srsName: wgs84, kind: latFirst ? "latlon" : "lonlat" };
    }
    return null;
}

function getFeatureHref(root) {
    return operationGetRequests(root, "GetFeature").map((get) => get.attrs?.href).find(Boolean) || null;
}

function announcedOutputFormats(root, featureType) {
    const own = childrenNamed(childNamed(featureType, "OutputFormats"), "Format").map((node) => node.text.trim());
    const operations = childrenNamed(childNamed(root, "OperationsMetadata"), "Operation");
    const getFeature = operations.find((operation) => operation.attrs?.name === "GetFeature");
    const parameters = [
        ...childrenNamed(getFeature, "Parameter"),
        ...childrenNamed(childNamed(root, "OperationsMetadata"), "Parameter"),
    ].filter((parameter) => String(parameter.attrs?.name).toLowerCase() === "outputformat");
    const allowed = parameters
        .flatMap((parameter) => childrenNamed(childNamed(parameter, "AllowedValues"), "Value"))
        .map((value) => value.text.trim());
    return [...own, ...allowed].filter(Boolean);
}

export function chooseJsonOutputFormat(formats) {
    const normalized = formats.map((format) => ({ format, key: format.toLowerCase().replace(/\s+/g, "") }));
    for (const preferred of JSON_FORMAT_PREFERENCE) {
        const match = normalized.find(({ key }) => key === preferred.replace(/\s+/g, ""));
        if (match) return match.format;
    }
    return normalized.find(({ key }) => key.includes("json"))?.format || null;
}

/**
 * Resuelve, desde el GetCapabilities ya convertido en árbol, cómo pedir los elementos del tipo.
 * Devuelve `{ version, getFeatureUrl, typeName, outputFormat, srsName, crsKind }` o `{ error }`;
 * agrega `warning` si el tipo no anuncia un CRS que el visor pueda usar (la carga se intenta igual).
 */
export function resolveWfsFeatureType(root, { typeName, capabilitiesUrl, serviceUrl, pageProtocol }) {
    const version = String(root?.attrs?.version || "");
    if (!version.startsWith("2.0")) {
        return { error: "El servicio no respondió como WFS 2.0. Revise la URL del servicio." };
    }

    const featureTypes = childrenNamed(childNamed(root, "FeatureTypeList"), "FeatureType");
    const byName = featureTypes.find((type) => childText(type, "Name") === typeName);
    // Se acepta el nombre sin prefijo («cities» por «ms:cities») si identifica un solo tipo.
    const byLocalName = featureTypes.filter((type) => childText(type, "Name").split(":").pop() === typeName);
    const featureType = byName || (byLocalName.length === 1 ? byLocalName[0] : null);
    if (!featureType) return { error: `El servicio WFS no publica el tipo de elemento «${typeName}».` };

    const outputFormat = chooseJsonOutputFormat(announcedOutputFormats(root, featureType));
    if (!outputFormat) {
        return { error: "El servicio WFS solo ofrece GML; el visor necesita una salida GeoJSON." };
    }

    const href = getFeatureHref(root) || serviceUrl;
    const getFeatureUrl = loadableUrl(href, capabilitiesUrl, pageProtocol, secureHostOf(serviceUrl));
    if (!getFeatureUrl) return { error: "El servicio WFS no indica una dirección de GetFeature que el navegador pueda usar." };

    const listedCrs = [
        childText(featureType, "DefaultCRS") || childText(featureType, "DefaultSRS"),
        ...childrenNamed(featureType, "OtherCRS").map((node) => node.text),
        ...childrenNamed(featureType, "OtherSRS").map((node) => node.text),
    ];
    const crs = chooseWfsCrs(listedCrs);
    const name = childText(featureType, "Name");

    return {
        version: version === "2.0.2" ? "2.0.2" : "2.0.0",
        getFeatureUrl,
        typeName: name,
        outputFormat,
        srsName: crs ? crs.srsName : FALLBACK_SRS_NAME,
        crsKind: crs ? crs.kind : "mercator",
        ...(crs ? {} : {
            warning: `El servicio WFS no anuncia EPSG:3857 ni EPSG:4326 para «${name}»; `
                + "se piden los elementos en EPSG:3857 y puede que no carguen.",
        }),
    };
}

const toRadians = (degrees) => (degrees * Math.PI) / 180;
const toDegrees = (radians) => (radians * 180) / Math.PI;

export function lonLatToMercator([lon, lat]) {
    const safeLat = clamp(lat, -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE);
    return [EARTH_RADIUS * toRadians(lon), EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + toRadians(safeLat) / 2))];
}

export function mercatorToLonLat([x, y]) {
    return [toDegrees(x / EARTH_RADIUS), toDegrees(2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2)];
}

/** URL de GetFeature para la vista `{ west, south, east, north }` (grados). */
export function getFeatureRequestUrl(config, { west, south, east, north }, count = OGC_WFS_MAX_FEATURES) {
    const lon = (value) => clamp(value, -180, 180);
    const lat = (value) => clamp(value, -90, 90);
    let bbox;
    if (config.crsKind === "mercator") {
        bbox = [...lonLatToMercator([lon(west), lat(south)]), ...lonLatToMercator([lon(east), lat(north)])];
    } else if (config.crsKind === "latlon") {
        bbox = [lat(south), lon(west), lat(north), lon(east)];
    } else {
        bbox = [lon(west), lat(south), lon(east), lat(north)];
    }

    const url = new URL(config.getFeatureUrl);
    const params = {
        SERVICE: "WFS",
        VERSION: config.version,
        REQUEST: "GetFeature",
        TYPENAMES: config.typeName,
        OUTPUTFORMAT: config.outputFormat,
        SRSNAME: config.srsName,
        BBOX: [...bbox.map(roundCoordinate), config.srsName].join(","),
        COUNT: String(count),
    };
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return url.toString();
}

function mapCoordinates(geometry, transform) {
    if (!geometry) return geometry;
    if (geometry.type === "GeometryCollection") {
        return { ...geometry, geometries: (geometry.geometries || []).map((child) => mapCoordinates(child, transform)) };
    }
    const walk = (coordinates) => (typeof coordinates?.[0] === "number" ? transform(coordinates) : (coordinates || []).map(walk));
    return { ...geometry, coordinates: walk(geometry.coordinates) };
}

function firstPositions(features, limit = 50) {
    const positions = [];
    const walk = (coordinates) => {
        if (positions.length >= limit || !Array.isArray(coordinates)) return;
        if (typeof coordinates[0] === "number") positions.push(coordinates);
        else coordinates.forEach(walk);
    };
    for (const feature of features) {
        const geometry = feature?.geometry;
        if (geometry?.type === "GeometryCollection") (geometry.geometries || []).forEach((child) => walk(child?.coordinates));
        else walk(geometry?.coordinates);
        if (positions.length >= limit) break;
    }
    return positions;
}

/**
 * Lleva las coordenadas de la respuesta a lon/lat (lo que espera GeoJSON y Leaflet). En 3857 las
 * desproyecta; en 4326 revisa el orden de los ejes contra la vista pedida, porque varía según el servidor.
 */
export function normalizeWfsFeatures(features, config, view) {
    if (config.crsKind === "mercator") {
        const inMeters = firstPositions(features).some(([x, y]) => Math.abs(x) > 180 || Math.abs(y) > 90);
        if (!inMeters) return features;
        return features.map((feature) => ({ ...feature, geometry: mapCoordinates(feature.geometry, (c) => [...mercatorToLonLat(c), ...c.slice(2)]) }));
    }

    const inside = ([lon, lat]) => lon >= view.west - 1e-6 && lon <= view.east + 1e-6 && lat >= view.south - 1e-6 && lat <= view.north + 1e-6;
    const positions = firstPositions(features);
    const asLonLat = positions.filter((c) => inside([c[0], c[1]])).length;
    const asLatLon = positions.filter((c) => inside([c[1], c[0]])).length;
    if (asLatLon <= asLonLat) return features;
    return features.map((feature) => ({ ...feature, geometry: mapCoordinates(feature.geometry, (c) => [c[1], c[0], ...c.slice(2)]) }));
}

function exceptionText(text) {
    const match = /<(?:\w+:)?ExceptionText>([\s\S]*?)<\/(?:\w+:)?ExceptionText>/.exec(text || "");
    return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/\s+/g, " ").trim().slice(0, 300) : null;
}

/**
 * Pide los elementos de la vista con GetFeature. Devuelve `{ features, numberMatched, truncated }`;
 * lanza un Error con un mensaje para el usuario si el servicio falla, o un AbortError si se cancela.
 */
export async function fetchWfsFeaturesInView({
    config,
    view,
    signal,
    fetchImpl = globalThis.fetch?.bind(globalThis),
    maxFeatures = OGC_WFS_MAX_FEATURES,
    timeoutMs = REQUEST_TIMEOUT_MS,
}) {
    return fetchExternal(getFeatureRequestUrl(config, view, maxFeatures), { fetchImpl, signal, timeoutMs }, async (response) => {
        const text = await response.text();
        const serviceMessage = exceptionText(text);
        if (serviceMessage) throw new Error(`El servicio WFS respondió: ${serviceMessage}`);
        if (!response.ok) throw new Error(`El servicio respondió con el estado ${response.status}.`);

        let body;
        try {
            body = JSON.parse(text);
        } catch {
            throw new Error("La respuesta del servicio WFS no es GeoJSON válido.");
        }
        if (body?.type !== "FeatureCollection" || !Array.isArray(body.features)) {
            throw new Error("La respuesta del servicio WFS no es una colección GeoJSON.");
        }

        const features = normalizeWfsFeatures(body.features.slice(0, maxFeatures), config, view);
        // GeoServer informa numberMatched o totalFeatures; puede venir como «unknown» o no venir.
        const matched = [body.numberMatched, body.totalFeatures]
            .filter((value) => value !== null && value !== undefined && value !== "")
            .map(Number)
            .find(Number.isFinite);
        const numberMatched = matched ?? null;
        const truncated = body.features.length >= maxFeatures || (numberMatched !== null && numberMatched > features.length);
        return { features, numberMatched, truncated };
    });
}
