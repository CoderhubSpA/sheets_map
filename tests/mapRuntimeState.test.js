import test from "node:test";
import assert from "node:assert/strict";

import { MAP_ACTION_CONTRACTS } from "../src/utils/mapActionContracts.js";
import {
    applyMapRuntimeSnapshot,
    cloneMapRuntimeValue,
    createMapBootstrapActions,
    createMapRuntimeSnapshot,
    restoreMapRuntimeState,
} from "../src/utils/mapRuntimeState.js";

const BOOTSTRAP_ACTIONS = [
    "addLayer",
    "removeLayer",
    "setLayerRenderState",
    "setLayerVisibility",
    "configureMapZoom",
    "teleportTo",
];

function createRuntime(overrides = {}) {
    return {
        dynamic_layer_registry: {},
        vector_tile_legends: {},
        center: [-33.472, -70.769],
        zoom: 7,
        current_zoom: 7,
        map_min_zoom: undefined,
        map_max_zoom: undefined,
        base_tile_max_zoom: undefined,
        base_tile_max_native_zoom: undefined,
        base_tile_options_revision: 0,
        external_view_override: false,
        ...overrides,
    };
}

test("declares explicit contracts for every bootstrap map action", () => {
    BOOTSTRAP_ACTIONS.forEach((action) => {
        const contract = MAP_ACTION_CONTRACTS[action];
        assert.ok(contract, `Missing contract for ${action}`);
        assert.ok(Array.isArray(contract.required));
        assert.equal(typeof contract.payload, "object");
    });

    assert.deepEqual(MAP_ACTION_CONTRACTS.addLayer.required, ["id", "type", "source"]);
    assert.deepEqual(MAP_ACTION_CONTRACTS.removeLayer.required, ["layerId"]);
    assert.deepEqual(MAP_ACTION_CONTRACTS.setLayerRenderState.required, [
        "layerId",
        "renderState",
    ]);
    assert.deepEqual(MAP_ACTION_CONTRACTS.setLayerVisibility.required, ["layerId", "visible"]);
    assert.deepEqual(MAP_ACTION_CONTRACTS.teleportTo.required, ["latLng"]);
    assert.equal(MAP_ACTION_CONTRACTS.setLayerVisibility.payload.visible, "boolean");
    assert.equal(MAP_ACTION_CONTRACTS.configureMapZoom.payload.minZoom, "number");
    assert.equal(Object.isFrozen(MAP_ACTION_CONTRACTS), true);
    assert.equal(Object.isFrozen(MAP_ACTION_CONTRACTS.addLayer), true);
    assert.equal(Object.isFrozen(MAP_ACTION_CONTRACTS.addLayer.required), true);
    assert.equal(Object.isFrozen(MAP_ACTION_CONTRACTS.addLayer.payload), true);
});

test("returns every public bootstrap action result synchronously", () => {
    const calls = [];
    const runtime = {
        zoom: 7,
        external_view_override: false,
        map: {
            setView: (...args) => calls.push(["setView", ...args]),
        },
        clampMapZoom: (zoom) => zoom,
        clearLocationMarker: () => calls.push(["clearMarker"]),
        addPublicLayer: (definition) => ({ action: "add", definition }),
        removePublicLayer: (layerId) => ({ action: "remove", layerId }),
        setPublicLayerRenderState: (layerId, renderState) => ({
            action: "render",
            layerId,
            renderState,
        }),
        setPublicLayerVisibility: (layerId, visible) => ({
            action: "visibility",
            layerId,
            visible,
        }),
        configureMapZoom: (payload) => ({ action: "zoom", payload }),
    };
    const actions = createMapBootstrapActions(runtime);
    const results = [
        actions.teleportTo({ latLng: [-33.4, -70.6], zoom: 12 }),
        actions.addLayer({ id: "layer-a" }),
        actions.removeLayer({ layerId: "layer-a" }),
        actions.setLayerRenderState({ layerId: "layer-a", renderState: { visible: true } }),
        actions.setLayerVisibility({ layerId: "layer-a", visible: false }),
        actions.configureMapZoom({ minZoom: 8, maxZoom: 18 }),
    ];

    assert.deepEqual(results, [
        true,
        { action: "add", definition: { id: "layer-a" } },
        { action: "remove", layerId: "layer-a" },
        { action: "render", layerId: "layer-a", renderState: { visible: true } },
        { action: "visibility", layerId: "layer-a", visible: false },
        { action: "zoom", payload: { minZoom: 8, maxZoom: 18 } },
    ]);
    results.forEach((result) => assert.equal(result instanceof Promise, false));
    assert.deepEqual(runtime.center, [-33.4, -70.6]);
    assert.equal(runtime.zoom, 12);
    assert.equal(runtime.external_view_override, true);
    assert.deepEqual(calls, [
        ["clearMarker"],
        ["setView", [-33.4, -70.6], 12, {}],
    ]);
});

test("restores map state and preserves an unchanged location marker", async () => {
    const snapshot = {
        ...createMapRuntimeSnapshot(createRuntime({
            dynamic_layer_registry: { prior: { definition: { id: "prior" } } },
            map_min_zoom: 8,
            map_max_zoom: 18,
            base_tile_max_zoom: 18,
            base_tile_max_native_zoom: 16,
            zoom: 12,
            current_zoom: 12,
        })),
        locationMarker: { lat: -33.4, lng: -70.6 },
    };
    const runtime = createRuntime({
        dynamic_layer_registry: { candidate: { definition: { id: "candidate" } } },
        zoom: 15,
        current_zoom: 15,
    });
    const calls = [];
    const map = {
        setMinZoom: (value) => calls.push(["minZoom", value]),
        setMaxZoom: (value) => calls.push(["maxZoom", value]),
        setView: (center, zoom, options) => calls.push(["view", center, zoom, options]),
    };

    const restored = await restoreMapRuntimeState({
        runtime,
        snapshot,
        map,
        hasLocationMarker: true,
        currentLocationMarker: { lat: -33.4, lng: -70.6 },
        rebuildDynamicLayers: () => calls.push(["rebuild"]),
        clearLocationMarker: () => calls.push(["clearMarker"]),
        setLocationMarker: (marker) => calls.push(["setMarker", marker]),
        nextTick: async () => calls.push(["nextTick"]),
    });

    assert.equal(restored, true);
    assert.deepEqual(Object.keys(runtime.dynamic_layer_registry), ["prior"]);
    assert.equal(runtime.zoom, 12);
    assert.deepEqual(calls, [
        ["rebuild"],
        ["minZoom", 8],
        ["maxZoom", 18],
        ["view", [-33.472, -70.769], 12, { animate: false }],
        ["nextTick"],
    ]);
});

test("rejects marker restoration before mutating state when the map is unavailable", async () => {
    const runtime = createRuntime({
        dynamic_layer_registry: { candidate: { definition: { id: "candidate" } } },
        zoom: 15,
        current_zoom: 15,
    });
    const before = createMapRuntimeSnapshot(runtime);
    const snapshot = {
        ...createMapRuntimeSnapshot(createRuntime()),
        locationMarker: { lat: -33.4, lng: -70.6 },
    };
    let rebuilt = false;

    await assert.rejects(
        restoreMapRuntimeState({
            runtime,
            snapshot,
            map: null,
            rebuildDynamicLayers: () => {
                rebuilt = true;
            },
        }),
        /without a map runtime/,
    );

    assert.deepEqual(createMapRuntimeSnapshot(runtime), before);
    assert.equal(rebuilt, false);
});

test("replaces or removes a changed location marker exactly once", async () => {
    const runtime = createRuntime();
    const map = {};
    const markerCalls = [];
    const snapshot = {
        ...createMapRuntimeSnapshot(runtime),
        locationMarker: { lat: -34, lng: -71 },
    };

    await restoreMapRuntimeState({
        runtime,
        snapshot,
        map,
        hasLocationMarker: true,
        currentLocationMarker: { lat: -33, lng: -70 },
        clearLocationMarker: () => markerCalls.push("clear"),
        setLocationMarker: (marker) => markerCalls.push(["set", marker]),
    });
    assert.deepEqual(markerCalls, ["clear", ["set", { lat: -34, lng: -71 }]]);

    markerCalls.length = 0;
    await restoreMapRuntimeState({
        runtime,
        snapshot: { ...snapshot, locationMarker: null },
        map,
        hasLocationMarker: true,
        currentLocationMarker: { lat: -34, lng: -71 },
        clearLocationMarker: () => markerCalls.push("clear"),
        setLocationMarker: (marker) => markerCalls.push(["set", marker]),
    });
    assert.deepEqual(markerCalls, ["clear"]);
});

test("rejects incoherent zoom bounds before mutating runtime state", () => {
    const runtime = createRuntime({ zoom: 15, current_zoom: 15 });
    const before = createMapRuntimeSnapshot(runtime);
    const snapshot = {
        ...createMapRuntimeSnapshot(createRuntime()),
        mapMinZoom: 18,
        mapMaxZoom: 12,
    };

    assert.throws(
        () => applyMapRuntimeSnapshot(runtime, snapshot),
        /minZoom cannot exceed maxZoom/,
    );
    assert.deepEqual(createMapRuntimeSnapshot(runtime), before);
});

test("clones cyclic runtime values and mutable built-ins without shared references", () => {
    const sharedDate = new Date("2026-08-21T00:00:00.000Z");
    const expression = /layer/gi;
    expression.lastIndex = 3;
    const sparse = new Array(3);
    sparse[0] = "first";
    const source = {
        date: sharedDate,
        expression,
        sparse,
        map: new Map([
            ["layer", { visible: true }],
            [sharedDate, "shared-date"],
        ]),
        set: new Set(["a", "b"]),
    };
    source.self = source;

    const clone = cloneMapRuntimeValue(source);

    assert.notEqual(clone, source);
    assert.equal(clone.self, clone);
    assert.notEqual(clone.date, source.date);
    assert.equal(clone.date.getTime(), source.date.getTime());
    assert.equal(clone.map.get(clone.date), "shared-date");
    assert.notEqual(clone.expression, expression);
    assert.equal(clone.expression.lastIndex, 3);
    assert.equal(clone.sparse.length, 3);
    assert.equal(Object.prototype.hasOwnProperty.call(clone.sparse, 1), false);
    assert.notEqual(clone.map, source.map);
    assert.deepEqual(clone.map.get("layer"), { visible: true });
    assert.notEqual(clone.map.get("layer"), source.map.get("layer"));
    assert.notEqual(clone.set, source.set);
    assert.deepEqual([...clone.set], ["a", "b"]);

    const poisoned = JSON.parse('{"__proto__":{"polluted":true}}');
    const safeClone = cloneMapRuntimeValue(poisoned);
    assert.equal(Object.getPrototypeOf(safeClone), Object.prototype);
    assert.equal(Object.prototype.polluted, undefined);
    assert.equal(Object.prototype.hasOwnProperty.call(safeClone, "__proto__"), true);
});

test("accepts a lagging current zoom but rejects invalid snapshot shapes", () => {
    const runtime = createRuntime();
    const transitionSnapshot = {
        ...createMapRuntimeSnapshot(runtime),
        zoom: 12,
        currentZoom: 7,
        mapMinZoom: 10,
        mapMaxZoom: 18,
    };

    assert.doesNotThrow(() => applyMapRuntimeSnapshot(runtime, transitionSnapshot));
    assert.throws(
        () => applyMapRuntimeSnapshot(runtime, {
            ...transitionSnapshot,
            center: null,
        }),
        /center must be a valid LatLng/,
    );
    assert.throws(
        () => applyMapRuntimeSnapshot(runtime, {
            ...transitionSnapshot,
            dynamicLayerRegistry: new Map(),
        }),
        /dynamicLayerRegistry must be a record object/,
    );
    assert.throws(
        () => applyMapRuntimeSnapshot(runtime, {
            ...transitionSnapshot,
            center: [false, []],
        }),
        /center must be a valid LatLng/,
    );
    assert.throws(
        () => applyMapRuntimeSnapshot(runtime, {
            ...transitionSnapshot,
            center: [-33, -70, 0, 999],
        }),
        /center must be a valid LatLng/,
    );
    assert.throws(
        () => applyMapRuntimeSnapshot(runtime, {
            ...transitionSnapshot,
            center: new Array(2),
        }),
        /center must be a valid LatLng/,
    );
});

test("restores dynamic layers, view, and configured zoom limits from an isolated snapshot", () => {
    const runtime = {
        dynamic_layer_registry: {
            prior: {
                definition: {
                    id: "prior",
                    visible: false,
                    order: 7,
                    renderState: { styleExpressions: { fill: "#123456" } },
                },
                payload: { layer_id: "prior", visible: false, order: 7 },
            },
        },
        vector_tile_legends: { prior: { visible: true, items: [{ label: "Prior" }] } },
        center: [-33.4, -70.6],
        zoom: 12,
        current_zoom: 12,
        map_min_zoom: 8,
        map_max_zoom: 18,
        base_tile_max_zoom: 18,
        base_tile_max_native_zoom: 16,
        base_tile_options_revision: 4,
        external_view_override: false,
    };
    const snapshot = createMapRuntimeSnapshot(runtime);

    runtime.dynamic_layer_registry.prior.definition.visible = true;
    runtime.dynamic_layer_registry.candidate = {
        definition: { id: "candidate", visible: true, order: 8 },
    };
    runtime.vector_tile_legends.candidate = { visible: true, items: [] };
    runtime.center = [-30, -71];
    runtime.zoom = 17;
    runtime.current_zoom = 17;
    runtime.map_min_zoom = 11;
    runtime.map_max_zoom = 22;
    runtime.base_tile_max_zoom = 22;
    runtime.base_tile_max_native_zoom = 20;
    runtime.base_tile_options_revision = 5;
    runtime.external_view_override = true;

    applyMapRuntimeSnapshot(runtime, snapshot);

    assert.deepEqual(Object.keys(runtime.dynamic_layer_registry), ["prior"]);
    assert.equal(runtime.dynamic_layer_registry.prior.definition.visible, false);
    assert.equal(runtime.dynamic_layer_registry.prior.definition.order, 7);
    assert.deepEqual(runtime.dynamic_layer_registry.prior.definition.renderState, {
        styleExpressions: { fill: "#123456" },
    });
    assert.deepEqual(runtime.vector_tile_legends, snapshot.vectorTileLegends);
    assert.deepEqual(runtime.center, [-33.4, -70.6]);
    assert.equal(runtime.zoom, 12);
    assert.equal(runtime.current_zoom, 12);
    assert.equal(runtime.map_min_zoom, 8);
    assert.equal(runtime.map_max_zoom, 18);
    assert.equal(runtime.base_tile_max_zoom, 18);
    assert.equal(runtime.base_tile_max_native_zoom, 16);
    assert.equal(runtime.base_tile_options_revision, 4);
    assert.equal(runtime.external_view_override, false);

    snapshot.dynamicLayerRegistry.prior.definition.order = 99;
    assert.equal(runtime.dynamic_layer_registry.prior.definition.order, 7);
});

test("restores an empty first-bootstrap registry by removing candidate layers", () => {
    const runtime = {
        dynamic_layer_registry: {},
        vector_tile_legends: {},
        center: [-33.472, -70.769],
        zoom: 7,
        current_zoom: 7,
        map_min_zoom: undefined,
        map_max_zoom: undefined,
        base_tile_max_zoom: undefined,
        base_tile_max_native_zoom: undefined,
        base_tile_options_revision: 0,
        external_view_override: false,
    };
    const snapshot = createMapRuntimeSnapshot(runtime);

    runtime.dynamic_layer_registry.candidate = {
        definition: { id: "candidate", visible: true, order: 0 },
    };
    runtime.map_min_zoom = 10;
    runtime.map_max_zoom = 20;

    applyMapRuntimeSnapshot(runtime, snapshot);

    assert.deepEqual(runtime.dynamic_layer_registry, {});
    assert.equal(runtime.map_min_zoom, undefined);
    assert.equal(runtime.map_max_zoom, undefined);
});
