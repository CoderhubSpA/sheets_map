import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
    buildVectorTileLayerPayload,
    normalizePublicLayerDefinition,
    normalizePublicLayerPatch,
} from "../src/utils/dynamicLayers.js";
import {
    appendRequestGeneration,
    buildMapLibreRequest,
    fetchWithAuth,
    getBearerToken,
    getRequiredRequestAuthHeaders,
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
    }), true);
    assert.equal(layerRequiresBearer({
        sh_map_has_layer_requires_bearer: "invalid",
    }), true);
    assert.equal(layerRequiresBearer({
        sh_map_request_auth_mode: "unsupported-bearer",
    }), false);
    assert.equal(layerRequiresBearer({
        sh_map_request_auth_mode: 123,
    }), false);
    assert.equal(requestAuthForLayer(requestAuth, null), null);
});

test("keeps legacy ogp-bearer scoped to the layer origin", async (context) => {
    globalThis.__OGP_RUNTIME_AUTH__ = {
        getBearerToken: () => "legacy-token",
        isTrustedUrl: (url) => new URL(url).origin === "https://gis.test",
    };
    context.after(() => delete globalThis.__OGP_RUNTIME_AUTH__);
    const injectedRequestAuth = scopedAuthClient("injected-token");
    const layer = {
        sh_map_request_auth_mode: "ogp-bearer",
        sh_map_has_layer_url: "https://gis.test/vector/tiles/places/{z}/{x}/{y}.pbf",
    };
    const requestAuth = requestAuthForLayer(injectedRequestAuth, layer);

    assert.notEqual(requestAuth, injectedRequestAuth);

    assert.deepEqual(
        await getRequestAuthHeaders(requestAuth, "https://gis.test/vector/layers/places/legend"),
        { Authorization: "Bearer legacy-token" },
    );
    assert.deepEqual(
        await getRequestAuthHeaders(requestAuth, "https://fonts.test/glyph.pbf"),
        {},
    );
});

test("fails closed for cross-origin legacy auth without host trust", async (context) => {
    let tokenCalls = 0;
    globalThis.__OGP_RUNTIME_AUTH__ = {
        getBearerToken: () => {
            tokenCalls += 1;
            return "legacy-token";
        },
    };
    context.after(() => delete globalThis.__OGP_RUNTIME_AUTH__);
    const layer = {
        sh_map_request_auth_mode: "ogp-bearer",
        sh_map_has_layer_url: "https://untrusted.test/vector/tiles/places/{z}/{x}/{y}.pbf",
    };

    assert.deepEqual(
        await getRequestAuthHeaders(
            requestAuthForLayer(null, layer),
            "https://untrusted.test/vector/tiles/places/1/0/0.pbf",
        ),
        {},
    );
    assert.deepEqual(
        await getRequestAuthHeaders(
            requestAuthForLayer(null, layer),
            "https://external.test/vector/tiles/places/1/0/0.pbf",
        ),
        {},
    );
    assert.equal(tokenCalls, 0);
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

test("normalizes unsupported dynamic auth modes to anonymous compatibility", () => {
    const definition = {
        id: "places",
        type: "vector-tile",
        source: { tiles: ["https://gis.test/vector/tiles/places/{z}/{x}/{y}.pbf"] },
    };

    assert.deepEqual(
        normalizePublicLayerDefinition({
            ...definition,
            auth: { mode: "custom-bearer" },
        }).auth,
        { mode: "" },
    );
    assert.deepEqual(
        normalizePublicLayerDefinition({
            ...definition,
            auth: { mode: true },
        }).auth,
        { mode: "" },
    );
    assert.deepEqual(
        normalizePublicLayerDefinition({
            ...definition,
            auth: "runtime-bearer",
        }).auth,
        { mode: "runtime-bearer" },
    );
    assert.deepEqual(normalizePublicLayerPatch({ auth: "ogp-bearer" }), {
        auth: { mode: "ogp-bearer" },
    });
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

test("allows a lazy client to establish trust while obtaining its first token", async () => {
    let credential = null;
    let tokenCalls = 0;
    const requestAuth = {
        getHeaders: async (url) => {
            tokenCalls += 1;
            credential = {
                token: "lazy-token",
                origins: [new URL(url).origin],
            };
            return { Authorization: `Bearer ${credential.token}` };
        },
        isTrustedUrl: (url) => Boolean(
            credential?.origins.includes(new URL(url).origin),
        ),
    };

    assert.deepEqual(
        await getRequestAuthHeaders(requestAuth, "https://gis.test/wms"),
        { Authorization: "Bearer lazy-token" },
    );
    assert.equal(tokenCalls, 1);
});

test("never returns credentials for URLs the provider keeps untrusted", async () => {
    let asyncHeaderCalls = 0;
    let syncHeaderCalls = 0;
    const requestAuth = {
        getHeaders: async () => {
            asyncHeaderCalls += 1;
            return { Authorization: "Bearer must-not-leak" };
        },
        peekHeaders: () => {
            syncHeaderCalls += 1;
            return { Authorization: "Bearer must-not-leak" };
        },
        isTrustedUrl: (url) => {
            if (url === "invalid") throw new Error("Invalid URL");
            return false;
        },
    };

    assert.deepEqual(await getRequestAuthHeaders(requestAuth, "https://external.test/tile"), {});
    assert.deepEqual(peekRequestAuthHeaders(requestAuth, "invalid"), {});
    assert.equal(asyncHeaderCalls, 1);
    assert.equal(syncHeaderCalls, 0);
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

test("removes stale MapLibre authorization when the provider no longer trusts the URL", () => {
    const requestAuth = {
        peekHeaders: () => ({}),
        isTrustedUrl: () => false,
    };

    assert.deepEqual(buildMapLibreRequest({
        url: "https://gis.test/vector/tiles/places/1/0/0.pbf",
        resourceType: "Tile",
        tileUrl: "https://gis.test/vector/tiles/places/{z}/{x}/{y}.pbf",
        requestAuth,
        headers: {
            authorization: "Bearer stale-token",
            "X-Map-Request": "1",
        },
        baseUrl: "https://sheets.test/viewer",
    }), {
        url: "https://gis.test/vector/tiles/places/1/0/0.pbf",
        headers: { "X-Map-Request": "1" },
    });
});

test("retries transient protected auth bootstrap and reuses a stable cloned-layer client", async () => {
    let attempts = 0;
    const waits = [];
    const requestAuth = {
        getHeaders: async () => {
            attempts += 1;
            return attempts < 3 ? {} : { Authorization: "Bearer token-a" };
        },
        isTrustedUrl: () => true,
    };

    assert.deepEqual(
        await getRequiredRequestAuthHeaders(requestAuth, "https://gis.test/tiles", {
            attempts: 3,
            retryDelayMs: 10,
            wait: async (delay) => waits.push(delay),
        }),
        { Authorization: "Bearer token-a" },
    );
    assert.deepEqual(waits, [10, 20]);

    const firstLayer = {
        id: "places",
        sh_map_has_layer_url: "https://gis.test/vector/tiles/places/{z}/{x}/{y}.pbf",
        sh_map_has_layer_requires_bearer: true,
    };
    assert.equal(
        requestAuthForLayer(null, firstLayer),
        requestAuthForLayer(null, { ...firstLayer }),
    );
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

test("coalesces concurrent invalidation for the same rejected token", async () => {
    let token = "token-a";
    let getHeaderCalls = 0;
    let invalidateCalls = 0;
    let releaseFailures;
    let releaseInvalidation;
    let signalInvalidationStarted;
    const failuresReady = new Promise((resolve) => { releaseFailures = resolve; });
    const invalidationReady = new Promise((resolve) => { releaseInvalidation = resolve; });
    const invalidationStarted = new Promise((resolve) => { signalInvalidationStarted = resolve; });
    let firstAttempts = 0;
    const requestAuth = {
        getHeaders: async () => {
            getHeaderCalls += 1;
            return { Authorization: `Bearer ${token}` };
        },
        isTrustedUrl: () => true,
        invalidate: async (rejectedToken) => {
            invalidateCalls += 1;
            signalInvalidationStarted();
            await invalidationReady;
            if (token === rejectedToken) token = "token-b";
        },
    };
    const createRequest = () => {
        let attempts = 0;
        return requestWithAuth({
            url: "https://gis.test/wms",
            requestAuth,
            request: async (headers) => {
                attempts += 1;
                if (attempts > 1) return { status: 200, headers };
                firstAttempts += 1;
                if (firstAttempts === 2) releaseFailures();
                await failuresReady;
                return { status: 401 };
            },
        });
    };

    const pendingRequests = Promise.all([createRequest(), createRequest()]);
    await invalidationStarted;
    await Promise.resolve();
    assert.equal(invalidateCalls, 1);
    releaseInvalidation();

    const responses = await pendingRequests;
    assert.equal(getHeaderCalls, 3);
    assert.deepEqual(responses.map((response) => response.status), [200, 200]);
    assert.deepEqual(responses.map((response) => getBearerToken(response.headers)), [
        "token-b",
        "token-b",
    ]);
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

test("keeps native image transport for public WMS layers", () => {
    const source = readFileSync(
        new URL("../src/utils/authenticatedWmsLayer.js", import.meta.url),
        "utf8",
    );

    assert.match(
        source,
        /if \(!this\._requestAuth\) \{[\s\S]*this\._loadNativeTile\(tile, url, state, done\)/,
    );
    assert.match(source, /_loadNativeTile\(tile, url, state, done\)[\s\S]*tile\.src = url/);
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
