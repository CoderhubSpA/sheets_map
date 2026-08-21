import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { MAP_ACTION_CONTRACTS } from "../src/utils/mapActionContracts.js";
import {
    applyMapRuntimeSnapshot,
    createMapRuntimeSnapshot,
} from "../src/utils/mapRuntimeState.js";

const BOOTSTRAP_ACTIONS = [
    "addLayer",
    "removeLayer",
    "setLayerRenderState",
    "setLayerVisibility",
    "configureMapZoom",
    "teleportTo",
];
const sheetsMapSource = readFileSync(
    new URL("../src/components/SheetsMap.vue", import.meta.url),
    "utf8",
);

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
});

test("exposes strict readiness and awaited snapshot, restore, and mutation APIs", () => {
    assert.match(
        sheetsMapSource,
        /isRuntimeReady: \(\) => this\.map_configuration_ready && Boolean\(this\.map\)/,
    );
    assert.match(sheetsMapSource, /snapshotRuntimeState: \(\) => this\.snapshotRuntimeState\(\)/);
    assert.match(
        sheetsMapSource,
        /restoreRuntimeState: \(snapshot\) => this\.restoreRuntimeState\(snapshot\)/,
    );
    assert.match(
        sheetsMapSource,
        /async applyMapRuntimeMutation\(mutation\)[\s\S]*await this\.\$nextTick\(\)/,
    );
    assert.match(
        sheetsMapSource,
        /async restoreRuntimeState\(snapshot\)[\s\S]*setMinZoom[\s\S]*setMaxZoom[\s\S]*setView[\s\S]*await this\.\$nextTick\(\)/,
    );

    BOOTSTRAP_ACTIONS.forEach((action) => {
        const parameter = action === "addLayer" ? "definition" : "payload";
        assert.match(
            sheetsMapSource,
            new RegExp(`${action}: \\(${parameter}`, "m"),
        );
    });
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
