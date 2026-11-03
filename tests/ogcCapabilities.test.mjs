import assert from "node:assert/strict";
import test from "node:test";
import { createCapabilitiesLoader, fetchExternal } from "../src/utils/ogcCapabilities.js";

const URL_A = "https://ows.example.org/wms?SERVICE=WMS&REQUEST=GetCapabilities";
const ROOT = { name: "WMS_Capabilities", attrs: {}, children: [], text: "" };

// Cada llamada toma la siguiente respuesta de la lista: un objeto de respuesta o un error a lanzar.
function scriptedFetch(...outcomes) {
    const calls = [];
    const fetchImpl = async (url, options) => {
        calls.push({ url, options });
        const outcome = outcomes[Math.min(calls.length, outcomes.length) - 1];
        if (outcome instanceof Error) throw outcome;
        return {
            ok: outcome.ok ?? true,
            status: outcome.status ?? 200,
            headers: { get: () => outcome.contentLength ?? null },
            text: async () => outcome.body ?? "<xml/>",
        };
    };
    return { calls, fetchImpl };
}

test("reads the capabilities without credentials and keeps a successful document", async () => {
    const { calls, fetchImpl } = scriptedFetch({});
    const loader = createCapabilitiesLoader({ fetchImpl, parseXml: () => ROOT });

    assert.deepEqual(await loader.load(URL_A), { root: ROOT });
    assert.deepEqual(await loader.load(URL_A), { root: ROOT });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.credentials, "omit");
    assert.equal(calls[0].options.headers, undefined);
});

test("reports why the capabilities could not be read", async () => {
    const cases = [
        [{ ok: false, status: 404 }, () => ROOT, /estado 404/],
        [{ contentLength: String(20 * 1024 * 1024) }, () => ROOT, /supera los 10 MB/],
        [{ body: "<html>" }, () => null, /no es un XML válido/],
        [new TypeError("Failed to fetch"), () => ROOT, /no respondió o no permite el acceso desde este sitio \(CORS\)/],
    ];
    for (const [outcome, parseXml, message] of cases) {
        const loader = createCapabilitiesLoader({ fetchImpl: scriptedFetch(outcome).fetchImpl, parseXml });
        const result = await loader.load(URL_A);
        assert.equal(result.root, undefined);
        assert.match(result.error, message);
    }
});

test("reports a timeout and asks again on the next load", async () => {
    let calls = 0;
    const fetchImpl = (_url, { signal }) => {
        calls += 1;
        return new Promise((_resolve, reject) => {
            signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
        });
    };
    const loader = createCapabilitiesLoader({ fetchImpl, parseXml: () => ROOT, timeoutMs: 5 });

    assert.match((await loader.load(URL_A)).error, /tardó demasiado/);
    await loader.load(URL_A);
    assert.equal(calls, 2);
});

test("retries a failed service and then keeps the document once it answers", async () => {
    const { calls, fetchImpl } = scriptedFetch(new TypeError("Failed to fetch"), {});
    const loader = createCapabilitiesLoader({ fetchImpl, parseXml: () => ROOT });

    assert.ok((await loader.load(URL_A)).error);
    assert.deepEqual(await loader.load(URL_A), { root: ROOT });
    assert.deepEqual(await loader.load(URL_A), { root: ROOT });
    assert.equal(calls.length, 2);
});

test("shares one request between simultaneous loads of the same URL", async () => {
    const { calls, fetchImpl } = scriptedFetch({});
    const loader = createCapabilitiesLoader({ fetchImpl, parseXml: () => ROOT });
    await Promise.all([loader.load(URL_A), loader.load(URL_A)]);
    assert.equal(calls.length, 1);
});

test("keeps an external cancellation as AbortError", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = (_url, { signal }) => (signal.aborted
        ? Promise.reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
        : Promise.resolve({ ok: true }));
    await assert.rejects(
        fetchExternal(URL_A, { fetchImpl, signal: controller.signal, timeoutMs: 1000 }, async () => "read"),
        { name: "AbortError" },
    );
});

test("never sends the site's cookies or an Authorization header to the external service", async () => {
    const calls = [];
    const fetchImpl = async (url, options) => {
        calls.push(options);
        return { ok: true };
    };
    await fetchExternal(URL_A, { fetchImpl, timeoutMs: 1000, headers: { Accept: "application/json" } }, async () => null);
    await fetchExternal(URL_A, { fetchImpl, timeoutMs: 1000 }, async () => null);

    for (const options of calls) {
        assert.equal(options.credentials, "omit");
        assert.equal(Object.keys(options.headers || {}).some((name) => name.toLowerCase() === "authorization"), false);
    }
    assert.deepEqual(calls[0].headers, { Accept: "application/json" });
});
