import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
    OGC_WMS_1_3_0_VERSION,
    ogcWmsLayerConfig,
    ogcWmsServiceUrl,
} from "../src/utils/ogcWms.js";

const layer = (overrides = {}) => ({
    id: "layer-1",
    name: "Capa externa",
    sh_map_has_layer_url: "https://ows.example.org/service",
    sh_map_has_layer_geoserver_layer: "roads",
    sh_map_has_layer_wms_format: "image/png",
    ...overrides,
});

test("builds a WMS 1.3.0 configuration from the layer columns", () => {
    assert.deepEqual(ogcWmsLayerConfig(layer(), "https:"), {
        baseUrl: "https://ows.example.org/service",
        layers: "roads",
        format: "image/png",
        version: "1.3.0",
    });
    assert.equal(OGC_WMS_1_3_0_VERSION, "1.3.0");
});

test("defaults the format to image/png and trims the layer name", () => {
    const config = ogcWmsLayerConfig(
        layer({ sh_map_has_layer_wms_format: null, sh_map_has_layer_geoserver_layer: "  roads,rivers " }),
        "https:",
    );
    assert.equal(config.format, "image/png");
    assert.equal(config.layers, "roads,rivers");
});

test("removes client-managed KVP parameters pasted from a GetCapabilities URL", () => {
    const { url } = ogcWmsServiceUrl(
        "https://ows.example.org/wms?SERVICE=WMS&Request=GetCapabilities&version=1.1.1&map=/data/roads.map#top",
        "https:",
    );
    const parsed = new URL(url);
    assert.deepEqual(Array.from(parsed.searchParams.keys()), ["map"]);
    assert.equal(parsed.searchParams.get("map"), "/data/roads.map");
    assert.equal(parsed.hash, "");
});

test("keeps a URL without parameters untouched", () => {
    assert.equal(
        ogcWmsServiceUrl("https://ows.example.org/geoserver/wms", "https:").url,
        "https://ows.example.org/geoserver/wms",
    );
});

test("rejects http services on an https page (mixed content)", () => {
    const config = ogcWmsLayerConfig(layer({ sh_map_has_layer_url: "http://ows.example.org/wms" }), "https:");
    assert.match(config.error, /http/);
    assert.equal(config.baseUrl, undefined);
});

test("allows http services when the page itself is http", () => {
    const config = ogcWmsLayerConfig(layer({ sh_map_has_layer_url: "http://localhost:8080/wms" }), "http:");
    assert.equal(config.baseUrl, "http://localhost:8080/wms");
});

test("rejects missing, invalid, non-http and credentialed URLs", () => {
    for (const value of [undefined, "", "   ", "not a url", "ftp://ows.example.org/wms", "https://user:secret@ows.example.org/wms"]) {
        const config = ogcWmsLayerConfig(layer({ sh_map_has_layer_url: value }), "https:");
        assert.ok(config.error, `se esperaba error para ${String(value)}`);
        assert.equal(config.baseUrl, undefined);
    }
});

test("rejects a layer without the service layer name", () => {
    for (const value of [undefined, null, "", "  "]) {
        const config = ogcWmsLayerConfig(layer({ sh_map_has_layer_geoserver_layer: value }), "https:");
        assert.match(config.error, /nombre de la capa/);
    }
});

test("external OGC WMS layers never receive the internal request auth", () => {
    const source = readFileSync(new URL("../src/components/SheetsMap.vue", import.meta.url), "utf8");
    const block = source.match(/<authenticated-wms-tile-layer v-for="entry in renderable_ogc_wms"[\s\S]*?\/>/);
    assert.ok(block, "no se encontró el bloque de capas OGC WMS");
    assert.match(block[0], /:request_auth="null"/);
    assert.doesNotMatch(block[0], /requestAuthForLayer/);
});
