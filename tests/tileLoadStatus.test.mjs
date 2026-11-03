import assert from "node:assert/strict";
import test from "node:test";
import { watchTileLoad } from "../src/utils/tileLoadStatus.js";

// Emisor mínimo con la misma forma que `on(eventMap)` / `off(eventMap)` de Leaflet.
function fakeTileLayer() {
    const listeners = new Map();
    return {
        on(map) {
            for (const [name, fn] of Object.entries(map)) listeners.set(name, fn);
        },
        off(map) {
            for (const [name, fn] of Object.entries(map)) if (listeners.get(name) === fn) listeners.delete(name);
        },
        fire(name) {
            listeners.get(name)?.();
        },
        listenerCount: () => listeners.size,
    };
}

test("reports the failed tiles of each view once it finishes loading", () => {
    const layer = fakeTileLayer();
    const statuses = [];
    watchTileLoad(layer, (status) => statuses.push(status));

    layer.fire("loading");
    for (const event of ["tileload", "tileerror", "tileload", "tileerror", "tileerror"]) layer.fire(event);
    layer.fire("load");
    layer.fire("loading");
    layer.fire("tileload");
    layer.fire("load");

    assert.deepEqual(statuses, [
        { loading: true, failed: 0, total: 0 },
        { loading: false, failed: 3, total: 5 },
        { loading: true, failed: 0, total: 0 },
        { loading: false, failed: 0, total: 1 },
    ]);
});

test("stops listening when the returned function is called", () => {
    const layer = fakeTileLayer();
    const stop = watchTileLoad(layer, () => {});
    assert.equal(layer.listenerCount(), 4);
    stop();
    assert.equal(layer.listenerCount(), 0);
});
