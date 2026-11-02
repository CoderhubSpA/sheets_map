import assert from "node:assert/strict";
import test from "node:test";
import {
    capabilitiesUrl,
    createOgcWmsLegendResolver,
    getLegendGraphicUrl,
    legendFromCapabilities,
    loadableImageUrl,
    parseXmlToTree,
} from "../src/utils/ogcWmsLegend.js";

const el = (name, attrs = {}, ...children) => ({
    name,
    attrs,
    children: children.filter((child) => typeof child === "object"),
    text: children.filter((child) => typeof child === "string").join(""),
});
const legendUrl = (href) => el("LegendURL", { width: "20", height: "20" },
    el("Format", {}, "image/png"),
    el("OnlineResource", { type: "simple", href }));
const style = (name, ...legends) => el("Style", {}, el("Name", {}, name), ...legends);
const layer = (name, ...children) => el("Layer", {}, ...(name ? [el("Name", {}, name)] : []), ...children);
const capabilities = ({ legendGraphic = false, layers = [] } = {}) => el("WMS_Capabilities", { version: "1.3.0" },
    el("Capability", {},
        el("Request", {},
            el("GetCapabilities"),
            el("GetMap"),
            ...(legendGraphic ? [el("GetLegendGraphic")] : [])),
        layer(null, ...layers)));

const BASE = "https://ows.example.org/wms";

test("reads the LegendURL of the layer's default style", () => {
    const root = capabilities({
        layers: [layer("roads",
            style("night", legendUrl("https://ows.example.org/legend/night.png")),
            style("default", legendUrl("https://ows.example.org/legend/default.png")))],
    });
    assert.deepEqual(legendFromCapabilities(root, "roads"), {
        found: true,
        legendHref: "https://ows.example.org/legend/default.png",
        supportsGetLegendGraphic: false,
    });
});

test("uses the first style when none is called default", () => {
    const root = capabilities({
        layers: [layer("roads",
            style("main", legendUrl("https://ows.example.org/legend/main.png")),
            style("alt", legendUrl("https://ows.example.org/legend/alt.png")))],
    });
    assert.equal(legendFromCapabilities(root, "roads").legendHref, "https://ows.example.org/legend/main.png");
});

test("inherits styles from parent layers as WMS 1.3.0 defines", () => {
    const root = capabilities({
        layers: [layer("transport",
            style("default", legendUrl("https://ows.example.org/legend/transport.png")),
            layer("roads"))],
    });
    assert.equal(legendFromCapabilities(root, "roads").legendHref, "https://ows.example.org/legend/transport.png");
});

test("reports a missing layer and a namespaced GetLegendGraphic declaration", () => {
    const root = capabilities({ legendGraphic: true, layers: [layer("roads")] });
    assert.deepEqual(legendFromCapabilities(root, "rivers"), {
        found: false,
        legendHref: null,
        supportsGetLegendGraphic: true,
    });
    assert.equal(legendFromCapabilities(root, "roads").legendHref, null);
});

test("builds GetCapabilities and GetLegendGraphic requests keeping vendor parameters", () => {
    const caps = new URL(capabilitiesUrl(`${BASE}?map=/data/roads.map`));
    assert.equal(caps.searchParams.get("REQUEST"), "GetCapabilities");
    assert.equal(caps.searchParams.get("VERSION"), "1.3.0");
    assert.equal(caps.searchParams.get("map"), "/data/roads.map");

    const legend = new URL(getLegendGraphicUrl(BASE, "roads"));
    assert.equal(legend.searchParams.get("REQUEST"), "GetLegendGraphic");
    assert.equal(legend.searchParams.get("LAYER"), "roads");
    assert.equal(legend.searchParams.get("FORMAT"), "image/png");
    assert.equal(legend.searchParams.get("SLD_VERSION"), "1.1.0");
});

test("only accepts legend images the page can load", () => {
    assert.equal(loadableImageUrl("legend.png", `${BASE}?REQUEST=GetCapabilities`, "https:"), "https://ows.example.org/legend.png");
    assert.equal(loadableImageUrl("http://ows.example.org/legend.png", BASE, "https:"), null);
    assert.equal(loadableImageUrl("http://ows.example.org/legend.png", BASE, "http:"), "http://ows.example.org/legend.png");
    assert.equal(loadableImageUrl("javascript:alert(1)", BASE, "https:"), null);
    assert.equal(loadableImageUrl("https://user:secret@ows.example.org/legend.png", BASE, "https:"), null);
});

test("parseXmlToTree returns null without a DOM parser or for invalid XML", () => {
    assert.equal(parseXmlToTree("<a/>", undefined), null);
    class BrokenParser {
        parseFromString() {
            return { documentElement: {}, getElementsByTagName: () => [{}] };
        }
    }
    assert.equal(parseXmlToTree("<a>", BrokenParser), null);
});

function fakeFetch(body, { ok = true, contentLength = null } = {}) {
    const calls = [];
    const fetchImpl = async (url, options) => {
        calls.push({ url, options });
        if (body instanceof Error) throw body;
        return {
            ok,
            headers: { get: (name) => (name === "content-length" ? contentLength : null) },
            text: async () => "<xml/>",
        };
    };
    return { calls, fetchImpl };
}

test("resolves the legend once per service and without credentials", async () => {
    const root = capabilities({
        layers: [
            layer("roads", style("default", legendUrl("https://ows.example.org/legend/roads.png"))),
            layer("rivers", style("default", legendUrl("/legend/rivers.png"))),
        ],
    });
    const { calls, fetchImpl } = fakeFetch("ok");
    const resolver = createOgcWmsLegendResolver({ fetchImpl, parseXml: () => root });

    assert.deepEqual(await resolver.resolve({ baseUrl: BASE, layers: "roads, rivers" }, "https:"), [
        "https://ows.example.org/legend/roads.png",
        "https://ows.example.org/legend/rivers.png",
    ]);
    assert.deepEqual(await resolver.resolve({ baseUrl: BASE, layers: "roads" }, "https:"), [
        "https://ows.example.org/legend/roads.png",
    ]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.credentials, "omit");
    assert.equal(new URL(calls[0].url).searchParams.get("REQUEST"), "GetCapabilities");
});

test("falls back to GetLegendGraphic when the capabilities cannot be read", async () => {
    const { fetchImpl } = fakeFetch(new TypeError("Failed to fetch"));
    const resolver = createOgcWmsLegendResolver({ fetchImpl, parseXml: () => null });
    const [url] = await resolver.resolve({ baseUrl: BASE, layers: "roads" }, "https:");
    assert.equal(new URL(url).searchParams.get("REQUEST"), "GetLegendGraphic");
});

test("uses GetLegendGraphic only when the service declares it and has no LegendURL", async () => {
    const declared = createOgcWmsLegendResolver({
        fetchImpl: fakeFetch("ok").fetchImpl,
        parseXml: () => capabilities({ legendGraphic: true, layers: [layer("roads")] }),
    });
    const [url] = await declared.resolve({ baseUrl: BASE, layers: "roads" }, "https:");
    assert.equal(new URL(url).searchParams.get("LAYER"), "roads");

    const undeclared = createOgcWmsLegendResolver({
        fetchImpl: fakeFetch("ok").fetchImpl,
        parseXml: () => capabilities({ layers: [layer("roads")] }),
    });
    assert.deepEqual(await undeclared.resolve({ baseUrl: BASE, layers: "roads" }, "https:"), []);
});

test("skips an http LegendURL on an https page and tries GetLegendGraphic instead", async () => {
    const resolver = createOgcWmsLegendResolver({
        fetchImpl: fakeFetch("ok").fetchImpl,
        parseXml: () => capabilities({
            legendGraphic: true,
            layers: [layer("roads", style("default", legendUrl("http://ows.example.org/legend/roads.png")))],
        }),
    });
    const [url] = await resolver.resolve({ baseUrl: BASE, layers: "roads" }, "https:");
    assert.equal(new URL(url).searchParams.get("REQUEST"), "GetLegendGraphic");
});

test("ignores oversized or failed capabilities responses", async () => {
    let parsed = 0;
    const parseXml = () => { parsed += 1; return capabilities(); };
    const oversized = createOgcWmsLegendResolver({
        fetchImpl: fakeFetch("ok", { contentLength: String(20 * 1024 * 1024) }).fetchImpl,
        parseXml,
    });
    const [fallback] = await oversized.resolve({ baseUrl: BASE, layers: "roads" }, "https:");
    assert.equal(new URL(fallback).searchParams.get("REQUEST"), "GetLegendGraphic");

    const failed = createOgcWmsLegendResolver({ fetchImpl: fakeFetch("ok", { ok: false }).fetchImpl, parseXml });
    await failed.resolve({ baseUrl: BASE, layers: "roads" }, "https:");
    assert.equal(parsed, 0);
});
