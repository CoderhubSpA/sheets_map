import assert from "node:assert/strict";
import test from "node:test";
import { buildVectorTileLayerPayload } from "../src/utils/dynamicLayers.js";
import {
    appendRequestGeneration,
    buildMapLibreRequest,
    fetchWithAuth,
    getBearerToken,
    getRequestAuthHeaders,
    layerRequiresBearer,
    peekRequestAuthHeaders,
    requestAuthForLayer,
    requestWithAuth,
} from "../src/utils/requestAuth.mjs";

function scopedAuthClient(initialToken = "token-a") {
    let token = initialToken;
    return {
        getHeaders: async () => token ? { Authorization: `Bearer ${token}` } : {},
        peekHeaders: () => token ? { Authorization: `Bearer ${token}` } : {},
        isTrustedUrl: (url) => new URL(url).origin === "https://gis.test",
        invalidate: (rejectedToken) => {
            if (token !== rejectedToken) return false;
            token = "token-b";
            return true;
        },
    };
}

test("selects the runtime auth client only for opted-in layers", () => {
    const requestAuth = scopedAuthClient();

    for (const value of [true, 1, "1", "true", " TRUE "]) {
        const layer = { sh_map_has_layer_requires_bearer: value };
        assert.equal(layerRequiresBearer(layer), true);
        assert.equal(requestAuthForLayer(requestAuth, layer), requestAuth);
    }
    for (const value of [false, 0, "0", "false", null, undefined]) {
        const layer = { sh_map_has_layer_requires_bearer: value };
        assert.equal(layerRequiresBearer(layer), false);
        assert.equal(requestAuthForLayer(requestAuth, layer), null);
    }
    assert.equal(layerRequiresBearer({
        sh_map_request_auth_mode: "runtime-bearer",
    }), true);
    assert.equal(layerRequiresBearer({
        sh_map_request_auth_mode: "ogp-bearer",
    }), true);
    assert.equal(layerRequiresBearer({
        sh_map_request_auth_mode: " OGP-BEARER ",
    }), true);
    assert.equal(layerRequiresBearer({
        sh_map_has_layer_requires_bearer: false,
        sh_map_request_auth_mode: "runtime-bearer",
    }), false);
    assert.equal(requestAuthForLayer(requestAuth, null), null);
});

test("keeps legacy ogp-bearer scoped to the layer origin", async (context) => {
    globalThis.__OGP_RUNTIME_AUTH__ = {
        getBearerToken: () => "legacy-token",
    };
    context.after(() => delete globalThis.__OGP_RUNTIME_AUTH__);
    const layer = {
        sh_map_request_auth_mode: "ogp-bearer",
        sh_map_has_layer_url: "https://gis.test/vector/tiles/places/{z}/{x}/{y}.pbf",
    };
    const requestAuth = requestAuthForLayer(null, layer);

    assert.deepEqual(
        await getRequestAuthHeaders(requestAuth, "https://gis.test/vector/layers/places/legend"),
        { Authorization: "Bearer legacy-token" },
    );
    assert.deepEqual(
        await getRequestAuthHeaders(requestAuth, "https://fonts.test/glyph.pbf"),
        {},
    );
});

test("returns a fail-closed client when protected auth is unavailable", async () => {
    const layer = {
        sh_map_has_layer_requires_bearer: true,
        sh_map_has_layer_url: "https://gis.test/wms",
    };
    const requestAuth = requestAuthForLayer(null, layer);

    assert.equal(requestAuthForLayer(null, layer), requestAuth);
    assert.deepEqual(await getRequestAuthHeaders(requestAuth, layer.sh_map_has_layer_url), {});
});

test("marks both current and legacy dynamic auth modes as protected", () => {
    for (const mode of ["runtime-bearer", "ogp-bearer"]) {
        const payload = buildVectorTileLayerPayload({
            id: `layer-${mode}`,
            name: mode,
            source: { tiles: ["https://gis.test/vector/tiles/places/{z}/{x}/{y}.pbf"] },
            sourceLayer: "places",
            attribution: "",
            visibleColumns: [],
            legendMode: "none",
            renderState: null,
            request: { headers: {} },
            auth: { mode },
            visible: true,
            opacity: 1,
            order: 0,
        });

        assert.equal(payload.layer.sh_map_has_layer_requires_bearer, true);
    }
});

test("scopes async and synchronous headers to the client-confirmed origin", async () => {
    const requestAuth = scopedAuthClient();

    assert.deepEqual(
        await getRequestAuthHeaders(requestAuth, "https://gis.test/wfs"),
        { Authorization: "Bearer token-a" },
    );
    assert.deepEqual(
        await getRequestAuthHeaders(requestAuth, "https://fonts.test/glyph.pbf"),
        {},
    );
    assert.deepEqual(
        peekRequestAuthHeaders(requestAuth, "https://fonts.test/glyph.pbf"),
        {},
    );
});

test("does not invoke the credential provider for untrusted or invalid URLs", async () => {
    let headerCalls = 0;
    const requestAuth = {
        getHeaders: async () => {
            headerCalls += 1;
            return { Authorization: "Bearer must-not-leak" };
        },
        peekHeaders: () => {
            headerCalls += 1;
            return { Authorization: "Bearer must-not-leak" };
        },
        isTrustedUrl: (url) => {
            if (url === "invalid") throw new Error("Invalid URL");
            return false;
        },
    };

    assert.deepEqual(await getRequestAuthHeaders(requestAuth, "https://external.test/tile"), {});
    assert.deepEqual(peekRequestAuthHeaders(requestAuth, "invalid"), {});
    assert.equal(headerCalls, 0);
});

test("keeps MapLibre headers on vector tiles and off external glyphs", () => {
    const requestAuth = scopedAuthClient();
    const tileUrl = "https://gis.test/vector/tiles/places/{z}/{x}/{y}.pbf";

    assert.deepEqual(buildMapLibreRequest({
        url: "https://gis.test/vector/tiles/places/1/0/0.pbf",
        resourceType: "Tile",
        tileUrl,
        requestAuth,
        headers: { "X-Map-Request": "1" },
        baseUrl: "https://sheets.test/viewer",
    }), {
        url: "https://gis.test/vector/tiles/places/1/0/0.pbf",
        headers: {
            "X-Map-Request": "1",
            Authorization: "Bearer token-a",
        },
    });
    assert.deepEqual(buildMapLibreRequest({
        url: "https://demotiles.maplibre.org/font/Open%20Sans/0-255.pbf",
        resourceType: "Glyphs",
        tileUrl,
        requestAuth,
        headers: { "X-Map-Request": "1" },
        baseUrl: "https://sheets.test/viewer",
    }), {
        url: "https://demotiles.maplibre.org/font/Open%20Sans/0-255.pbf",
    });
});

test("invalidates the exact token and retries one time after an Axios-style 401", async () => {
    const requestAuth = scopedAuthClient();
    const calls = [];
    const result = await requestWithAuth({
        url: "https://gis.test/vector/layers/places/legend",
        requestAuth,
        request: async (headers) => {
            calls.push(headers);
            if (calls.length === 1) throw { response: { status: 401 } };
            return { status: 200 };
        },
    });

    assert.equal(result.status, 200);
    assert.deepEqual(calls.map(getBearerToken), ["token-a", "token-b"]);
});

test("retries a Fetch-style 401 once and never authorizes an external URL", async () => {
    const requestAuth = scopedAuthClient();
    const trustedCalls = [];
    const trustedResponse = await fetchWithAuth({
        url: "https://gis.test/wms",
        requestAuth,
        fetchImpl: async (_url, init) => {
            trustedCalls.push(init.headers);
            return { status: trustedCalls.length === 1 ? 401 : 200 };
        },
    });
    assert.equal(trustedResponse.status, 200);
    assert.deepEqual(trustedCalls.map(getBearerToken), ["token-a", "token-b"]);

    const externalCalls = [];
    await assert.rejects(
        requestWithAuth({
            url: "https://fonts.test/glyph.pbf",
            requestAuth,
            request: async (headers) => {
                externalCalls.push(headers);
                throw { response: { status: 401 } };
            },
        }),
    );
    assert.equal(externalCalls.length, 1);
    assert.deepEqual(externalCalls[0], {});
});

test("fails closed when a protected request cannot obtain a Bearer token", async () => {
    const requestAuth = {
        getHeaders: async () => ({}),
        isTrustedUrl: () => true,
    };
    let requestCount = 0;

    await assert.rejects(
        requestWithAuth({
            url: "https://gis.test/wms",
            requestAuth,
            requireBearer: true,
            request: async () => {
                requestCount += 1;
                return { status: 200 };
            },
        }),
        /Bearer authentication is required/,
    );
    assert.equal(requestCount, 0);
});

test("separates MapLibre request generations without exposing the token", () => {
    assert.equal(
        appendRequestGeneration("https://gis.test/tiles/{z}/{x}/{y}.pbf", 0),
        "https://gis.test/tiles/{z}/{x}/{y}.pbf",
    );
    assert.equal(
        appendRequestGeneration("https://gis.test/tiles/{z}/{x}/{y}.pbf?filter=x#map", 2),
        "https://gis.test/tiles/{z}/{x}/{y}.pbf?filter=x&_sheets_auth_retry=2#map",
    );
    assert.equal(
        appendRequestGeneration("https://gis.test/tiles/1/0/0.pbf", 3, "_sheets_auth_token"),
        "https://gis.test/tiles/1/0/0.pbf?_sheets_auth_token=3",
    );
});
