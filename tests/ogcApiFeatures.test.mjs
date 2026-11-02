import assert from "node:assert/strict";
import test from "node:test";
import {
    crs84Bbox,
    fetchFeaturesInView,
    nextPageUrl,
    ogcFeaturesLayerConfig,
} from "../src/utils/ogcApiFeatures.js";

const LANDING = "https://api.example.org/ogc";
const layer = (overrides = {}) => ({
    sh_map_has_layer_url: LANDING,
    sh_map_has_layer_geoserver_layer: "lakes",
    ...overrides,
});

test("builds the items URL from the landing page and the collection id", () => {
    assert.deepEqual(ogcFeaturesLayerConfig(layer(), "https:"), {
        itemsUrl: "https://api.example.org/ogc/collections/lakes/items",
        collectionId: "lakes",
    });
    assert.equal(
        ogcFeaturesLayerConfig(layer({ sh_map_has_layer_url: `${LANDING}/?f=json&apikey=abc` }), "https:").itemsUrl,
        "https://api.example.org/ogc/collections/lakes/items?apikey=abc",
    );
});

test("accepts the collection or items URL and checks it against the configured id", () => {
    for (const url of [`${LANDING}/collections/lakes`, `${LANDING}/collections/lakes/items?limit=10&bbox=1,2,3,4`]) {
        assert.equal(
            ogcFeaturesLayerConfig(layer({ sh_map_has_layer_url: url, sh_map_has_layer_geoserver_layer: "" }), "https:").itemsUrl,
            "https://api.example.org/ogc/collections/lakes/items",
        );
    }
    assert.match(
        ogcFeaturesLayerConfig(layer({ sh_map_has_layer_url: `${LANDING}/collections/rivers` }), "https:").error,
        /«rivers».*«lakes»/,
    );
    assert.match(ogcFeaturesLayerConfig(layer({ sh_map_has_layer_geoserver_layer: "" }), "https:").error, /colección/);
    assert.match(ogcFeaturesLayerConfig(layer({ sh_map_has_layer_url: "http://api.example.org" }), "https:").error, /http/);
});

test("clamps the view to a CRS84 bbox", () => {
    assert.deepEqual(crs84Bbox({ west: -75.1234567, south: -40, east: -65, north: -30 }), [-75.123457, -40, -65, -30]);
    assert.deepEqual(crs84Bbox({ west: -200, south: -95, east: 170, north: 95 }), [-180, -90, 180, 90]);
    assert.deepEqual(crs84Bbox({ west: -190, south: -10, east: -170, north: 10 }), [-180, -10, -170, 10]);
});

test("follows next links only on the same server", () => {
    const current = "https://api.example.org/ogc/collections/lakes/items?limit=2";
    assert.equal(
        nextPageUrl({ links: [{ rel: "next", type: "application/geo+json", href: "items?offset=2" }] }, current),
        "https://api.example.org/ogc/collections/lakes/items?offset=2",
    );
    assert.equal(nextPageUrl({ links: [{ rel: "next", href: "https://evil.example.net/items" }] }, current), null);
    assert.equal(nextPageUrl({ links: [{ rel: "next", type: "text/html", href: "items.html" }] }, current), null);
    assert.equal(nextPageUrl({}, current), null);
});

const feature = (id) => ({ type: "Feature", id, geometry: { type: "Point", coordinates: [-70, -33] }, properties: { id } });

function pagedFetch(pages) {
    const calls = [];
    const fetchImpl = async (url, options) => {
        calls.push({ url, options });
        const page = pages[calls.length - 1];
        if (page instanceof Error) throw page;
        return { ok: page.ok ?? true, status: page.status ?? 200, json: async () => page.body };
    };
    return { calls, fetchImpl };
}

const ITEMS = "https://api.example.org/ogc/collections/lakes/items";

test("pages through next links with the GeoJSON Accept header and without credentials", async () => {
    const { calls, fetchImpl } = pagedFetch([
        { body: { type: "FeatureCollection", numberMatched: 3, features: [feature(1), feature(2)], links: [{ rel: "next", href: `${ITEMS}?offset=2` }] } },
        { body: { type: "FeatureCollection", features: [feature(3)], links: [] } },
    ]);
    const result = await fetchFeaturesInView({ itemsUrl: ITEMS, bbox: [-75, -40, -65, -30], fetchImpl, pageLimit: 2 });

    assert.deepEqual(result.features.map((f) => f.id), [1, 2, 3]);
    assert.equal(result.numberMatched, 3);
    assert.equal(result.truncated, false);
    const first = new URL(calls[0].url);
    assert.equal(first.searchParams.get("bbox"), "-75,-40,-65,-30");
    assert.equal(first.searchParams.get("limit"), "2");
    assert.match(calls[0].options.headers.Accept, /application\/geo\+json/);
    assert.equal(calls[0].options.credentials, "omit");
});

test("stops at the feature limit and reports the view as truncated", async () => {
    const { calls, fetchImpl } = pagedFetch([
        { body: { type: "FeatureCollection", numberMatched: 10, features: [feature(1), feature(2), feature(3)], links: [{ rel: "next", href: `${ITEMS}?offset=3` }] } },
    ]);
    const result = await fetchFeaturesInView({ itemsUrl: ITEMS, bbox: [0, 0, 1, 1], fetchImpl, pageLimit: 3, maxFeatures: 2 });
    assert.equal(calls.length, 1);
    assert.equal(new URL(calls[0].url).searchParams.get("limit"), "2");
    assert.deepEqual(result.features.map((f) => f.id), [1, 2]);
    assert.equal(result.truncated, true);
    assert.equal(result.numberMatched, 10);
});

test("explains HTTP errors and responses that are not GeoJSON collections", async () => {
    await assert.rejects(
        fetchFeaturesInView({ itemsUrl: ITEMS, bbox: [0, 0, 1, 1], fetchImpl: pagedFetch([{ ok: false, status: 404 }]).fetchImpl }),
        /estado 404/,
    );
    await assert.rejects(
        fetchFeaturesInView({ itemsUrl: ITEMS, bbox: [0, 0, 1, 1], fetchImpl: pagedFetch([{ body: { type: "Feature" } }]).fetchImpl }),
        /colección GeoJSON/,
    );
});

test("reports a timeout and propagates a cancellation", async () => {
    const hanging = (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
    });
    await assert.rejects(
        fetchFeaturesInView({ itemsUrl: ITEMS, bbox: [0, 0, 1, 1], fetchImpl: hanging, timeoutMs: 10 }),
        /tardó demasiado/,
    );

    const controller = new AbortController();
    const pending = fetchFeaturesInView({ itemsUrl: ITEMS, bbox: [0, 0, 1, 1], fetchImpl: hanging, signal: controller.signal, timeoutMs: 5000 });
    controller.abort();
    await assert.rejects(pending, (error) => error.name === "AbortError");
});
