import assert from "node:assert/strict";
import test from "node:test";
import {
    chooseJsonOutputFormat,
    chooseWfsCrs,
    fetchWfsFeaturesInView,
    getFeatureRequestUrl,
    lonLatToMercator,
    mercatorToLonLat,
    normalizeWfsFeatures,
    ogcWfsLayerRequest,
    resolveWfsFeatureType,
    wfsCapabilitiesUrl,
} from "../src/utils/ogcWfs.js";

const el = (name, attrs = {}, ...children) => ({
    name,
    attrs,
    children: children.filter((child) => typeof child === "object"),
    text: children.filter((child) => typeof child === "string").join(""),
});
const text = (name, value) => el(name, {}, String(value));

const SERVICE = "https://wfs.example.org/cgi-bin/wfs";
const featureType = (name, { defaultCrs = "urn:ogc:def:crs:EPSG::4326", otherCrs = [], formats = [] } = {}) =>
    el("FeatureType", {},
        text("Name", name),
        text("DefaultCRS", defaultCrs),
        ...otherCrs.map((crs) => text("OtherCRS", crs)),
        ...(formats.length ? [el("OutputFormats", {}, ...formats.map((format) => text("Format", format)))] : []));
const capabilities = ({ version = "2.0.0", types, getFeatureFormats = ["application/gml+xml; version=3.2"], href = `${SERVICE}?` } = {}) =>
    el("WFS_Capabilities", { version },
        el("OperationsMetadata", {},
            el("Operation", { name: "GetFeature" },
                el("DCP", {}, el("HTTP", {}, el("Get", { href }))),
                el("Parameter", { name: "outputFormat" },
                    el("AllowedValues", {}, ...getFeatureFormats.map((format) => text("Value", format)))))),
        el("FeatureTypeList", {}, ...types));
const options = (overrides = {}) => ({
    typeName: "ms:cities",
    capabilitiesUrl: wfsCapabilitiesUrl(SERVICE),
    serviceUrl: SERVICE,
    pageProtocol: "https:",
    ...overrides,
});

test("resolves a MapServer-like feature type with GeoJSON output in EPSG:3857", () => {
    const root = capabilities({
        types: [featureType("ms:cities", {
            otherCrs: ["urn:ogc:def:crs:EPSG::4269", "urn:ogc:def:crs:EPSG::3857"],
            formats: ["application/gml+xml; version=3.2", "application/json; subtype=geojson"],
        })],
    });
    assert.deepEqual(resolveWfsFeatureType(root, options()), {
        version: "2.0.0",
        getFeatureUrl: "https://wfs.example.org/cgi-bin/wfs?",
        typeName: "ms:cities",
        outputFormat: "application/json; subtype=geojson",
        srsName: "urn:ogc:def:crs:EPSG::3857",
        crsKind: "mercator",
    });
});

test("accepts the type name without prefix when it is unique", () => {
    const root = capabilities({ types: [featureType("ms:cities")], getFeatureFormats: ["application/json"] });
    assert.equal(resolveWfsFeatureType(root, options({ typeName: "cities" })).typeName, "ms:cities");
});

test("explains unsupported services, missing types and GML-only output", () => {
    assert.match(resolveWfsFeatureType(capabilities({ version: "1.1.0", types: [] }), options()).error, /WFS 2\.0/);
    assert.match(resolveWfsFeatureType(capabilities({ types: [] }), options()).error, /«ms:cities»/);
    assert.match(
        resolveWfsFeatureType(capabilities({ types: [featureType("ms:cities")] }), options()).error,
        /solo ofrece GML/,
    );
});

test("prefers standard GeoJSON media types and recognises vendor names", () => {
    assert.equal(chooseJsonOutputFormat(["application/gml+xml; version=3.2", "application/json", "application/geo+json"]), "application/geo+json");
    assert.equal(chooseJsonOutputFormat(["text/xml; subtype=gml/3.2.1", "application/json;subtype=geojson"]), "application/json;subtype=geojson");
    assert.equal(chooseJsonOutputFormat(["GEOJSON"]), "GEOJSON");
    assert.equal(chooseJsonOutputFormat(["application/gml+xml; version=3.2"]), null);
});

test("chooses Web Mercator first, then CRS84, then EPSG:4326 with its axis order", () => {
    assert.deepEqual(chooseWfsCrs(["urn:ogc:def:crs:EPSG::4326", "EPSG:900913"]), { srsName: "EPSG:900913", kind: "mercator" });
    assert.deepEqual(chooseWfsCrs(["urn:ogc:def:crs:OGC:1.3:CRS84"]), { srsName: "urn:ogc:def:crs:OGC:1.3:CRS84", kind: "lonlat" });
    assert.deepEqual(chooseWfsCrs(["urn:ogc:def:crs:EPSG::4326"]), { srsName: "urn:ogc:def:crs:EPSG::4326", kind: "latlon" });
    assert.deepEqual(chooseWfsCrs(["http://www.opengis.net/def/crs/EPSG/0/4326"]).kind, "latlon");
    assert.deepEqual(chooseWfsCrs(["EPSG:4326"]), { srsName: "EPSG:4326", kind: "lonlat" });
    assert.equal(chooseWfsCrs(["urn:ogc:def:crs:EPSG::32719"]), null);
});

const VIEW = { west: -76, south: -41, east: -66, north: -17 };
const mercatorConfig = {
    version: "2.0.0",
    getFeatureUrl: `${SERVICE}?map=demo`,
    typeName: "ms:cities",
    outputFormat: "application/json; subtype=geojson",
    srsName: "urn:ogc:def:crs:EPSG::3857",
    crsKind: "mercator",
};

test("builds GetFeature with the BBOX in the axis order of the requested CRS", () => {
    const url = new URL(getFeatureRequestUrl(mercatorConfig, VIEW, 2000));
    assert.equal(url.searchParams.get("REQUEST"), "GetFeature");
    assert.equal(url.searchParams.get("TYPENAMES"), "ms:cities");
    assert.equal(url.searchParams.get("COUNT"), "2000");
    assert.equal(url.searchParams.get("map"), "demo");
    const bbox = url.searchParams.get("BBOX").split(",");
    assert.equal(bbox.at(-1), "urn:ogc:def:crs:EPSG::3857");
    assert.ok(Number(bbox[0]) < -8000000 && Number(bbox[1]) < -5000000);

    const latlon = new URL(getFeatureRequestUrl({ ...mercatorConfig, srsName: "urn:ogc:def:crs:EPSG::4326", crsKind: "latlon" }, VIEW));
    assert.equal(latlon.searchParams.get("BBOX"), "-41,-76,-17,-66,urn:ogc:def:crs:EPSG::4326");
});

test("converts between Web Mercator and lon/lat", () => {
    const [x, y] = lonLatToMercator([-70.6666667, -33.45]);
    const [lon, lat] = mercatorToLonLat([x, y]);
    assert.ok(Math.abs(lon + 70.6666667) < 1e-6 && Math.abs(lat + 33.45) < 1e-6);
});

const point = (coordinates) => ({ type: "Feature", geometry: { type: "Point", coordinates }, properties: {} });

test("unprojects Web Mercator responses and leaves degree responses untouched", () => {
    const [santiago] = normalizeWfsFeatures([point([-7866577.353101981, -3955187.399354618])], mercatorConfig, VIEW);
    assert.ok(Math.abs(santiago.geometry.coordinates[0] + 70.6667) < 1e-3);
    assert.ok(Math.abs(santiago.geometry.coordinates[1] + 33.45) < 1e-3);

    const degrees = [point([-70.67, -33.45])];
    assert.equal(normalizeWfsFeatures(degrees, mercatorConfig, VIEW), degrees);
});

test("swaps lat/lon answers from servers that follow the URN axis order in GeoJSON", () => {
    const config = { ...mercatorConfig, srsName: "urn:ogc:def:crs:EPSG::4326", crsKind: "latlon" };
    const [swapped] = normalizeWfsFeatures([point([-33.45, -70.67])], config, VIEW);
    assert.deepEqual(swapped.geometry.coordinates, [-70.67, -33.45]);
    const lonLat = [point([-70.67, -33.45])];
    assert.equal(normalizeWfsFeatures(lonLat, config, VIEW), lonLat);
});

const respond = (body, { ok = true, status = 200 } = {}) => async (url, requestOptions) => {
    respond.last = { url, options: requestOptions };
    return { ok, status, text: async () => (typeof body === "string" ? body : JSON.stringify(body)) };
};

test("fetches the view without credentials and reports truncation", async () => {
    const fetchImpl = respond({ type: "FeatureCollection", numberMatched: 5, features: [point([-7866577, -3955187]), point([-7660636, -3879828])] });
    const result = await fetchWfsFeaturesInView({ config: mercatorConfig, view: VIEW, fetchImpl, maxFeatures: 2 });
    assert.equal(respond.last.options.credentials, "omit");
    assert.equal(result.features.length, 2);
    assert.equal(result.numberMatched, 5);
    assert.equal(result.truncated, true);

    const unknown = await fetchWfsFeaturesInView({
        config: mercatorConfig,
        view: VIEW,
        fetchImpl: respond({ type: "FeatureCollection", numberMatched: null, totalFeatures: "unknown", features: [] }),
    });
    assert.equal(unknown.numberMatched, null);
    assert.equal(unknown.truncated, false);
});

test("shows the service ExceptionText and rejects non-GeoJSON answers", async () => {
    const report = `<?xml version="1.0"?><ows:ExceptionReport><ows:Exception exceptionCode="InvalidParameterValue"><ows:ExceptionText><![CDATA[Feature type ms:nope not found]]></ows:ExceptionText></ows:Exception></ows:ExceptionReport>`;
    await assert.rejects(
        fetchWfsFeaturesInView({ config: mercatorConfig, view: VIEW, fetchImpl: respond(report, { ok: false, status: 400 }) }),
        /El servicio WFS respondió: Feature type ms:nope not found/,
    );
    await assert.rejects(
        fetchWfsFeaturesInView({ config: mercatorConfig, view: VIEW, fetchImpl: respond("<html></html>") }),
        /no es GeoJSON válido/,
    );
});

test("validates the layer row and builds the GetCapabilities request", () => {
    const layer = { sh_map_has_layer_url: `${SERVICE}?SERVICE=WFS&REQUEST=GetCapabilities&map=demo`, sh_map_has_layer_geoserver_layer: "ms:cities" };
    const request = ogcWfsLayerRequest(layer, "https:");
    assert.equal(request.serviceUrl, `${SERVICE}?map=demo`);
    const caps = new URL(request.capabilitiesUrl);
    assert.equal(caps.searchParams.get("REQUEST"), "GetCapabilities");
    assert.equal(caps.searchParams.get("ACCEPTVERSIONS"), "2.0.2,2.0.0");
    assert.match(ogcWfsLayerRequest({ ...layer, sh_map_has_layer_geoserver_layer: "" }, "https:").error, /tipo de elemento/);
});

test("warns and still requests EPSG:3857 when the type announces no usable CRS", () => {
    const root = capabilities({
        types: [featureType("ms:parcels", { defaultCrs: "urn:ogc:def:crs:EPSG::32719" })],
        getFeatureFormats: ["application/json"],
    });
    const resolved = resolveWfsFeatureType(root, options({ typeName: "ms:parcels" }));
    assert.equal(resolved.error, undefined);
    assert.equal(resolved.srsName, "urn:ogc:def:crs:EPSG::3857");
    assert.equal(resolved.crsKind, "mercator");
    assert.match(resolved.warning, /no anuncia EPSG:3857 ni EPSG:4326 para «ms:parcels»/);
});
