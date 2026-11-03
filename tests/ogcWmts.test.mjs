import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
    compatibleMatrixIds,
    fillTemplate,
    ogcWmtsLayerRequest,
    resolveWmtsLayer,
    wmtsCapabilitiesUrl,
    wmtsTileUrl,
} from "../src/utils/ogcWmts.js";

const el = (name, attrs = {}, ...children) => ({
    name,
    attrs,
    children: children.filter((child) => typeof child === "object"),
    text: children.filter((child) => typeof child === "string").join(""),
});
const text = (name, value) => el(name, {}, String(value));

const EDGE = "20037508.34278925";
const googleMatrix = (zoom, { id = String(zoom), scale = 559082264.0287178 / 2 ** zoom, corner = `-${EDGE} ${EDGE}`, size = 256 } = {}) =>
    el("TileMatrix", {},
        text("Identifier", id),
        text("ScaleDenominator", scale),
        text("TopLeftCorner", corner),
        text("TileWidth", size),
        text("TileHeight", size),
        text("MatrixWidth", 2 ** zoom),
        text("MatrixHeight", 2 ** zoom));
const matrixSet = (id, crs, matrices) => el("TileMatrixSet", {}, text("Identifier", id), text("SupportedCRS", crs), ...matrices);
const levels = (from, to, options) => Array.from({ length: to - from + 1 }, (_, i) => googleMatrix(from + i, options?.(from + i)));

const wmtsLayer = ({ id = "roads", formats = ["image/png"], styles = [el("Style", { isDefault: "true" }, text("Identifier", "default"))], links = ["GoogleMapsCompatible"], resources = [], dimensions = [] } = {}) =>
    el("Layer", {},
        text("Identifier", id),
        ...styles,
        ...formats.map((format) => text("Format", format)),
        ...dimensions,
        ...links.map((link) => el("TileMatrixSetLink", {}, text("TileMatrixSet", link))),
        ...resources.map((template) => el("ResourceURL", { format: formats[0], resourceType: "tile", template })));
const getTileOperation = (href, encoding = "KVP") => el("OperationsMetadata", {},
    el("Operation", { name: "GetTile" },
        el("DCP", {}, el("HTTP", {}, el("Get", { href },
            el("Constraint", { name: "GetEncoding" }, el("AllowedValues", {}, text("Value", encoding))))))));
const capabilities = ({ layers, sets, operations = [] }) => el("Capabilities", { version: "1.0.0" },
    ...operations,
    el("Contents", {}, ...layers, ...sets));

const SERVICE = "https://tiles.example.org/wmts/1.0.0/WMTSCapabilities.xml";
const resolveOptions = (overrides = {}) => ({
    layerId: "roads",
    preferredFormat: null,
    capabilitiesUrl: SERVICE,
    serviceUrl: SERVICE,
    pageProtocol: "https:",
    ...overrides,
});

test("maps TileMatrix identifiers to zoom levels by geometry, whatever the CRS spelling", () => {
    for (const crs of ["urn:ogc:def:crs:EPSG:6.18:3:3857", "urn:ogc:def:crs:EPSG::3857", "EPSG:3857", "urn:ogc:def:crs:EPSG:6.3:900913"]) {
        assert.deepEqual(compatibleMatrixIds(matrixSet("g", crs, levels(0, 2))), { 0: "0", 1: "1", 2: "2" }, crs);
    }
    // Escala y esquina en notación exponencial, como las publica ArcGIS.
    const esri = matrixSet("default028mm", "urn:ogc:def:crs:EPSG::3857", [
        googleMatrix(0, { scale: "5.590822640285016E8", corner: "-2.0037508342787E7 2.0037508342787E7" }),
        googleMatrix(1, { id: "L1", scale: "2.7954113201425034E8", corner: "-2.0037508342787E7 2.0037508342787E7" }),
    ]);
    assert.deepEqual(compatibleMatrixIds(esri), { 0: "0", 1: "L1" });
});

test("rejects tile matrix sets the viewer cannot draw", () => {
    assert.equal(compatibleMatrixIds(matrixSet("wgs84", "urn:ogc:def:crs:OGC:1.3:CRS84", levels(0, 2))), null);
    assert.equal(compatibleMatrixIds(matrixSet("big", "EPSG:3857", levels(0, 2, () => ({ size: 512 })))), null);
    assert.equal(compatibleMatrixIds(matrixSet("shifted", "EPSG:3857", levels(0, 2, () => ({ corner: "0 0" })))), null);
    assert.equal(compatibleMatrixIds(matrixSet("odd", "EPSG:3857", [googleMatrix(1, { scale: 123456 })])), null);
});

test("uses the RESTful template with the default style and dimension values", () => {
    const root = capabilities({
        layers: [wmtsLayer({
            formats: ["image/jpeg"],
            dimensions: [el("Dimension", {}, text("Identifier", "Time"), text("Default", "2026-11-03"))],
            resources: ["https://tiles.example.org/roads/{Style}/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg"],
        })],
        sets: [matrixSet("GoogleMapsCompatible", "EPSG:3857", levels(0, 9))],
    });
    const config = resolveWmtsLayer(root, resolveOptions());
    assert.equal(config.minNativeZoom, 0);
    assert.equal(config.maxNativeZoom, 9);
    assert.equal(
        wmtsTileUrl(config, { x: 3, y: 5, z: 4 }),
        "https://tiles.example.org/roads/default/2026-11-03/GoogleMapsCompatible/4/5/3.jpg",
    );
    assert.equal(wmtsTileUrl(config, { x: 0, y: 0, z: 12 }), "");
});

test("falls back to KVP GetTile and upgrades http on the service's own https host", () => {
    const root = capabilities({
        operations: [getTileOperation("http://tiles.example.org/wmts?")],
        layers: [wmtsLayer({ links: ["WGS84", "g"] })],
        sets: [
            matrixSet("WGS84", "urn:ogc:def:crs:OGC:1.3:CRS84", levels(0, 1)),
            matrixSet("g", "urn:ogc:def:crs:EPSG:6.3:900913", levels(0, 3, (z) => ({ id: `g:${z}` }))),
        ],
    });
    const config = resolveWmtsLayer(root, resolveOptions());
    const url = new URL(wmtsTileUrl(config, { x: 1, y: 2, z: 3 }));
    assert.equal(url.protocol, "https:");
    assert.equal(url.searchParams.get("REQUEST"), "GetTile");
    assert.equal(url.searchParams.get("LAYER"), "roads");
    assert.equal(url.searchParams.get("TILEMATRIXSET"), "g");
    assert.equal(url.searchParams.get("TILEMATRIX"), "g:3");
    assert.equal(url.searchParams.get("TILEROW"), "2");
    assert.equal(url.searchParams.get("TILECOL"), "1");
});

test("refuses http tiles from another host on an https page", () => {
    const root = capabilities({
        layers: [wmtsLayer({ resources: ["http://cdn.example.net/{TileMatrix}/{TileRow}/{TileCol}.png"] })],
        sets: [matrixSet("GoogleMapsCompatible", "EPSG:3857", levels(0, 2))],
    });
    assert.match(resolveWmtsLayer(root, resolveOptions()).error, /forma de pedir teselas/);
});

test("skips templates with variables it cannot fill", () => {
    const root = capabilities({
        layers: [wmtsLayer({
            resources: [
                "https://tiles.example.org/{Unknown}/{TileMatrix}/{TileRow}/{TileCol}.png",
                "https://tiles.example.org/ok/{TileMatrix}/{TileRow}/{TileCol}.png",
            ],
        })],
        sets: [matrixSet("GoogleMapsCompatible", "EPSG:3857", levels(0, 2))],
    });
    assert.equal(wmtsTileUrl(resolveWmtsLayer(root, resolveOptions()), { x: 0, y: 1, z: 2 }), "https://tiles.example.org/ok/2/1/0.png");
});

test("prefers the configured format and reads the style LegendURL", () => {
    const root = capabilities({
        layers: [wmtsLayer({
            formats: ["image/jpeg", "image/png"],
            styles: [
                el("Style", {}, text("Identifier", "night")),
                el("Style", { isDefault: "true" }, text("Identifier", "day"), el("LegendURL", { format: "image/png", href: "https://tiles.example.org/legend/day.png" })),
            ],
        })],
        operations: [getTileOperation("https://tiles.example.org/wmts?")],
        sets: [matrixSet("GoogleMapsCompatible", "EPSG:3857", levels(0, 2))],
    });
    const config = resolveWmtsLayer(root, resolveOptions({ preferredFormat: "image/png" }));
    const url = new URL(wmtsTileUrl(config, { x: 0, y: 0, z: 0 }));
    assert.equal(url.searchParams.get("FORMAT"), "image/png");
    assert.equal(url.searchParams.get("STYLE"), "day");
    assert.equal(config.legendHref, "https://tiles.example.org/legend/day.png");
});

test("explains a missing layer or an incompatible grid", () => {
    const sets = [matrixSet("WGS84", "urn:ogc:def:crs:OGC:1.3:CRS84", levels(0, 1))];
    assert.match(resolveWmtsLayer(capabilities({ layers: [], sets }), resolveOptions()).error, /no publica la capa «roads»/);
    assert.match(
        resolveWmtsLayer(capabilities({ layers: [wmtsLayer({ links: ["WGS84"] })], sets }), resolveOptions()).error,
        /grilla compatible/,
    );
});

test("builds the GetCapabilities URL for RESTful and KVP services", () => {
    assert.equal(wmtsCapabilitiesUrl(SERVICE), SERVICE);
    const kvp = new URL(wmtsCapabilitiesUrl("https://tiles.example.org/wmts?map=x"));
    assert.equal(kvp.searchParams.get("SERVICE"), "WMTS");
    assert.equal(kvp.searchParams.get("REQUEST"), "GetCapabilities");
    assert.equal(kvp.searchParams.get("map"), "x");
});

test("validates the layer row before reading the service", () => {
    const layer = { sh_map_has_layer_url: `${SERVICE}?SERVICE=WMTS&REQUEST=GetTile`, sh_map_has_layer_geoserver_layer: " roads " };
    assert.deepEqual(ogcWmtsLayerRequest(layer, "https:"), {
        serviceUrl: SERVICE,
        capabilitiesUrl: SERVICE,
        layerId: "roads",
        preferredFormat: null,
    });
    assert.match(ogcWmtsLayerRequest({ ...layer, sh_map_has_layer_geoserver_layer: "" }, "https:").error, /identificador/);
    assert.match(ogcWmtsLayerRequest({ ...layer, sh_map_has_layer_url: "http://x.org/wmts" }, "https:").error, /WMTS usa http/);
});

test("skips tiles outside the TileMatrixSetLimits announced for the layer", () => {
    // Límites como los que publica GeoWebCache para una capa acotada a Santiago.
    const limits = (matrix, minRow, maxRow, minCol, maxCol) => el("TileMatrixLimits", {},
        text("TileMatrix", matrix), text("MinTileRow", minRow), text("MaxTileRow", maxRow), text("MinTileCol", minCol), text("MaxTileCol", maxCol));
    const layer = wmtsLayer({ resources: ["https://tiles.example.org/{TileMatrix}/{TileRow}/{TileCol}.png"], links: [] });
    layer.children.push(el("TileMatrixSetLink", {},
        text("TileMatrixSet", "EPSG:900913"),
        el("TileMatrixSetLimits", {}, limits("EPSG:900913:7", 76, 76, 38, 38))));
    const root = capabilities({
        layers: [layer],
        sets: [matrixSet("EPSG:900913", "urn:ogc:def:crs:EPSG::900913", levels(0, 8, (z) => ({ id: `EPSG:900913:${z}` })))],
    });
    const config = resolveWmtsLayer(root, resolveOptions());
    assert.deepEqual(config.limits, { 7: { minRow: 76, maxRow: 76, minCol: 38, maxCol: 38 } });
    assert.equal(wmtsTileUrl(config, { x: 38, y: 76, z: 7 }), "https://tiles.example.org/EPSG:900913:7/76/38.png");
    assert.equal(wmtsTileUrl(config, { x: 39, y: 76, z: 7 }), "");
    assert.equal(wmtsTileUrl(config, { x: 38, y: 75, z: 7 }), "");
    // Un nivel sin límites publicados se pide completo.
    assert.equal(wmtsTileUrl(config, { x: 1, y: 2, z: 8 }), "https://tiles.example.org/EPSG:900913:8/2/1.png");
});

test("fills template variables case-insensitively and keeps colons", () => {
    assert.equal(fillTemplate("{tilematrix}/{TILEROW}/{TileCol}", { tilematrix: "EPSG:3857:5", tilerow: 1, tilecol: 2 }), "EPSG:3857:5/1/2");
});

test("external WMTS and Features layers never use the internal request auth", () => {
    for (const file of ["OgcWmtsTileLayer.vue", "OgcFeaturesLayer.vue"]) {
        const source = readFileSync(new URL(`../src/components/layers/${file}`, import.meta.url), "utf8");
        assert.doesNotMatch(source, /requestAuth|request_auth|Authorization/, file);
    }
});
