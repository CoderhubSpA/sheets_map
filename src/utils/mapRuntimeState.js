import {
    DEFAULT_MAP_MAX_ZOOM,
    DEFAULT_MAP_MIN_ZOOM,
} from "./mapZoom.js";
import { normalizePublicLayerAuth } from "./dynamicLayers.js";

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

const OPTIONAL_ZOOM_FIELDS = Object.freeze([
    "mapMinZoom",
    "mapMaxZoom",
    "baseTileMaxZoom",
    "baseTileMaxNativeZoom",
]);

function defineClonedProperty(target, key, value) {
    Object.defineProperty(target, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
    });
}

function cloneEnumerableProperties(source, target, seen) {
    Object.keys(source).forEach((key) => {
        defineClonedProperty(target, key, cloneMapRuntimeValue(source[key], seen));
    });
}

export function cloneMapRuntimeValue(value, seen = new WeakMap()) {
    if (value === null || typeof value !== "object") return value;
    if (seen.has(value)) return seen.get(value);

    if (value instanceof Date) {
        const copy = new Date(value.getTime());
        seen.set(value, copy);
        cloneEnumerableProperties(value, copy, seen);
        return copy;
    }
    if (value instanceof RegExp) {
        const copy = new RegExp(value.source, value.flags);
        copy.lastIndex = value.lastIndex;
        seen.set(value, copy);
        cloneEnumerableProperties(value, copy, seen);
        return copy;
    }

    if (value instanceof Map) {
        const copy = new Map();
        seen.set(value, copy);
        value.forEach((mapValue, key) => {
            copy.set(cloneMapRuntimeValue(key, seen), cloneMapRuntimeValue(mapValue, seen));
        });
        return copy;
    }

    if (value instanceof Set) {
        const copy = new Set();
        seen.set(value, copy);
        value.forEach((item) => copy.add(cloneMapRuntimeValue(item, seen)));
        return copy;
    }

    const copy = Array.isArray(value)
        ? new Array(value.length)
        : Object.create(Object.getPrototypeOf(value) === null ? null : Object.prototype);
    seen.set(value, copy);
    cloneEnumerableProperties(value, copy, seen);
    return copy;
}

function runSynchronousMapMutation(mutation) {
    if (typeof mutation !== "function") {
        throw new TypeError("Map runtime mutation requires a function.");
    }

    return mutation();
}

export function createMapBootstrapActions(runtime) {
    if (!runtime || typeof runtime !== "object") {
        throw new TypeError("Map bootstrap actions require a runtime object.");
    }

    return {
        teleportTo: (payload = {}) => runSynchronousMapMutation(() => {
            const latLng = payload?.latLng;
            const options = payload?.options || {};
            if (!latLng) return false;

            const requestedZoom = typeof payload?.zoom === "number" ? payload.zoom : runtime.zoom;
            const zoom = runtime.clampMapZoom(requestedZoom);

            if (options.externalOverride !== false) {
                runtime.external_view_override = true;
            }

            runtime.clearLocationMarker();
            runtime.center = latLng;
            runtime.zoom = zoom;
            if (runtime.map) {
                runtime.map.setView(latLng, zoom, options.leaflet || {});
            }
            return true;
        }),
        addLayer: (definition) =>
            runSynchronousMapMutation(() => runtime.addPublicLayer(definition)),
        removeLayer: (payload) =>
            runSynchronousMapMutation(
                () => runtime.removePublicLayer(
                    typeof payload === "string" ? payload : payload?.layerId,
                ),
            ),
        setLayerRenderState: (payload) =>
            runSynchronousMapMutation(
                () => runtime.setPublicLayerRenderState(payload?.layerId, payload?.renderState),
            ),
        setLayerVisibility: (payload) =>
            runSynchronousMapMutation(
                () => runtime.setPublicLayerVisibility(payload?.layerId, payload?.visible),
            ),
        configureMapZoom: (payload = {}) =>
            runSynchronousMapMutation(() => runtime.configureMapZoom(payload)),
    };
}

function assertRuntimeRecord(value, field) {
    const prototype = value && typeof value === "object"
        ? Object.getPrototypeOf(value)
        : null;
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value) ||
        (prototype !== Object.prototype && prototype !== null)
    ) {
        throw new TypeError(`Map runtime snapshot field ${field} must be a record object.`);
    }
}

function isCoordinate(value) {
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value !== "string" || value.trim() === "") return false;
    return Number.isFinite(Number(value));
}

function assertMapCenter(value) {
    const isCoordinateArray =
        Array.isArray(value) &&
        (value.length === 2 || value.length === 3) &&
        Array.from(value).every(isCoordinate);
    const isLatLngObject =
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        isCoordinate(value.lat) &&
        isCoordinate(value.lng);

    if (!isCoordinateArray && !isLatLngObject) {
        throw new TypeError("Map runtime snapshot center must be a valid LatLng value.");
    }
}

function assertOptionalZoomLimit(value, field) {
    if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
        throw new TypeError(
            `Map runtime snapshot field ${field} must be a non-negative integer or undefined.`,
        );
    }
}

function normalizeLocationMarker(value) {
    if (value === null || value === undefined) return null;
    if (
        !value ||
        typeof value !== "object" ||
        !Number.isFinite(value.lat) ||
        !Number.isFinite(value.lng)
    ) {
        throw new TypeError("Map runtime location marker must contain finite lat and lng values.");
    }

    return { lat: value.lat, lng: value.lng };
}

function sameLocation(first, second) {
    return Boolean(
        first &&
        second &&
        first.lat === second.lat &&
        first.lng === second.lng,
    );
}

function restoredProtection(value) {
    if (value === true || value === 1) return true;
    if (value === false || value === 0 || value === null || value === undefined) {
        return false;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["", "0", "false"].includes(normalized)) return false;
        return true;
    }
    return true;
}

function normalizeRestoredDynamicLayers(registry) {
    Object.values(registry).forEach((record) => {
        if (!record?.definition || record.definition.type !== "vector-tile") return;

        const payloadLayer = record.payload?.layer;
        const definitionAuth = normalizePublicLayerAuth(record.definition.auth);
        const payloadAuth = normalizePublicLayerAuth(payloadLayer?.sh_map_request_auth_mode);
        const auth = definitionAuth.mode ? definitionAuth : payloadAuth;
        record.definition.auth = auth;
        if (!payloadLayer) return;

        const explicitlyProtected = restoredProtection(
            payloadLayer.sh_map_has_layer_requires_bearer,
        );
        payloadLayer.sh_map_request_auth_mode = auth.mode;
        payloadLayer.sh_map_has_layer_requires_bearer = explicitlyProtected || Boolean(auth.mode);
    });
    return registry;
}

export function validateMapRuntimeSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
        throw new TypeError("Map runtime restoration requires a snapshot.");
    }

    const missing = REQUIRED_SNAPSHOT_FIELDS.filter(
        (field) => !Object.prototype.hasOwnProperty.call(snapshot, field),
    );
    if (missing.length > 0) {
        throw new TypeError(`Map runtime snapshot is missing fields: ${missing.join(", ")}.`);
    }

    assertRuntimeRecord(snapshot.dynamicLayerRegistry, "dynamicLayerRegistry");
    assertRuntimeRecord(snapshot.vectorTileLegends, "vectorTileLegends");
    assertMapCenter(snapshot.center);
    OPTIONAL_ZOOM_FIELDS.forEach((field) => assertOptionalZoomLimit(snapshot[field], field));

    if (!Number.isFinite(snapshot.zoom) || !Number.isFinite(snapshot.currentZoom)) {
        throw new TypeError("Map runtime snapshot zoom values must be finite numbers.");
    }
    if (
        !Number.isInteger(snapshot.baseTileOptionsRevision) ||
        snapshot.baseTileOptionsRevision < 0
    ) {
        throw new TypeError(
            "Map runtime snapshot field baseTileOptionsRevision must be a non-negative integer.",
        );
    }
    if (typeof snapshot.externalViewOverride !== "boolean") {
        throw new TypeError("Map runtime snapshot field externalViewOverride must be boolean.");
    }

    const minZoom = snapshot.mapMinZoom ?? DEFAULT_MAP_MIN_ZOOM;
    const maxZoom = snapshot.mapMaxZoom ?? DEFAULT_MAP_MAX_ZOOM;
    if (minZoom > maxZoom) {
        throw new RangeError("Map runtime snapshot minZoom cannot exceed maxZoom.");
    }
    if (snapshot.zoom < minZoom || snapshot.zoom > maxZoom) {
        throw new RangeError("Map runtime snapshot zoom must be within its configured bounds.");
    }
    return snapshot;
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
    validateMapRuntimeSnapshot(snapshot);

    const restoredState = {
        dynamicLayerRegistry: normalizeRestoredDynamicLayers(
            cloneMapRuntimeValue(snapshot.dynamicLayerRegistry),
        ),
        vectorTileLegends: cloneMapRuntimeValue(snapshot.vectorTileLegends),
        center: cloneMapRuntimeValue(snapshot.center),
        zoom: snapshot.zoom,
        currentZoom: snapshot.currentZoom,
        mapMinZoom: snapshot.mapMinZoom,
        mapMaxZoom: snapshot.mapMaxZoom,
        baseTileMaxZoom: snapshot.baseTileMaxZoom,
        baseTileMaxNativeZoom: snapshot.baseTileMaxNativeZoom,
        baseTileOptionsRevision: snapshot.baseTileOptionsRevision,
        externalViewOverride: snapshot.externalViewOverride,
    };

    runtime.dynamic_layer_registry = restoredState.dynamicLayerRegistry;
    runtime.vector_tile_legends = restoredState.vectorTileLegends;
    runtime.center = restoredState.center;
    runtime.zoom = restoredState.zoom;
    runtime.current_zoom = restoredState.currentZoom;
    runtime.map_min_zoom = restoredState.mapMinZoom;
    runtime.map_max_zoom = restoredState.mapMaxZoom;
    runtime.base_tile_max_zoom = restoredState.baseTileMaxZoom;
    runtime.base_tile_max_native_zoom = restoredState.baseTileMaxNativeZoom;
    runtime.base_tile_options_revision = restoredState.baseTileOptionsRevision;
    runtime.external_view_override = restoredState.externalViewOverride;

    return runtime;
}

export async function restoreMapRuntimeState({
    runtime,
    snapshot,
    map = null,
    hasLocationMarker = false,
    currentLocationMarker = null,
    rebuildDynamicLayers,
    clearLocationMarker,
    setLocationMarker,
    nextTick,
}) {
    validateMapRuntimeSnapshot(snapshot);

    const currentMarker = normalizeLocationMarker(currentLocationMarker);
    const restoredMarker = normalizeLocationMarker(snapshot.locationMarker);
    const hasCurrentMarker = hasLocationMarker || Boolean(currentMarker);

    if ((hasCurrentMarker || restoredMarker) && !map) {
        throw new Error("Cannot restore the map location marker without a map runtime.");
    }

    applyMapRuntimeSnapshot(runtime, snapshot);
    if (typeof rebuildDynamicLayers === "function") rebuildDynamicLayers();

    if (map) {
        if (typeof map.setMinZoom === "function") map.setMinZoom(runtime.map_min_zoom);
        if (typeof map.setMaxZoom === "function") map.setMaxZoom(runtime.map_max_zoom);
        if (typeof map.setView === "function") {
            map.setView(runtime.center, runtime.zoom, { animate: false });
        }
    }

    const markerIsUnchanged = sameLocation(currentMarker, restoredMarker);
    if (hasCurrentMarker && !markerIsUnchanged && typeof clearLocationMarker === "function") {
        clearLocationMarker();
    }
    if (restoredMarker && !markerIsUnchanged && typeof setLocationMarker === "function") {
        setLocationMarker(restoredMarker);
    }

    if (typeof nextTick === "function") await nextTick();
    return true;
}
