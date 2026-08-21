const REQUIRED_SNAPSHOT_FIELDS = Object.freeze([
    "dynamicLayerRegistry",
    "vectorTileLegends",
    "center",
    "zoom",
    "currentZoom",
    "mapMinZoom",
    "mapMaxZoom",
    "baseTileMaxZoom",
    "baseTileMaxNativeZoom",
    "baseTileOptionsRevision",
    "externalViewOverride",
]);

export function cloneMapRuntimeValue(value) {
    if (Array.isArray(value)) return value.map((item) => cloneMapRuntimeValue(item));
    if (!value || Object.prototype.toString.call(value) !== "[object Object]") return value;

    return Object.keys(value).reduce((copy, key) => {
        copy[key] = cloneMapRuntimeValue(value[key]);
        return copy;
    }, {});
}

export function createMapRuntimeSnapshot(runtime) {
    if (!runtime || typeof runtime !== "object") {
        throw new TypeError("Map runtime snapshot requires a runtime object.");
    }

    return {
        dynamicLayerRegistry: cloneMapRuntimeValue(runtime.dynamic_layer_registry || {}),
        vectorTileLegends: cloneMapRuntimeValue(runtime.vector_tile_legends || {}),
        center: cloneMapRuntimeValue(runtime.center),
        zoom: runtime.zoom,
        currentZoom: runtime.current_zoom,
        mapMinZoom: runtime.map_min_zoom,
        mapMaxZoom: runtime.map_max_zoom,
        baseTileMaxZoom: runtime.base_tile_max_zoom,
        baseTileMaxNativeZoom: runtime.base_tile_max_native_zoom,
        baseTileOptionsRevision: runtime.base_tile_options_revision,
        externalViewOverride: runtime.external_view_override,
    };
}

export function applyMapRuntimeSnapshot(runtime, snapshot) {
    if (!runtime || typeof runtime !== "object") {
        throw new TypeError("Map runtime restoration requires a runtime object.");
    }
    if (!snapshot || typeof snapshot !== "object") {
        throw new TypeError("Map runtime restoration requires a snapshot.");
    }

    const missing = REQUIRED_SNAPSHOT_FIELDS.filter(
        (field) => !Object.prototype.hasOwnProperty.call(snapshot, field),
    );
    if (missing.length > 0) {
        throw new TypeError(`Map runtime snapshot is missing fields: ${missing.join(", ")}.`);
    }

    runtime.dynamic_layer_registry = cloneMapRuntimeValue(snapshot.dynamicLayerRegistry);
    runtime.vector_tile_legends = cloneMapRuntimeValue(snapshot.vectorTileLegends);
    runtime.center = cloneMapRuntimeValue(snapshot.center);
    runtime.zoom = snapshot.zoom;
    runtime.current_zoom = snapshot.currentZoom;
    runtime.map_min_zoom = snapshot.mapMinZoom;
    runtime.map_max_zoom = snapshot.mapMaxZoom;
    runtime.base_tile_max_zoom = snapshot.baseTileMaxZoom;
    runtime.base_tile_max_native_zoom = snapshot.baseTileMaxNativeZoom;
    runtime.base_tile_options_revision = snapshot.baseTileOptionsRevision;
    runtime.external_view_override = snapshot.externalViewOverride;

    return runtime;
}
