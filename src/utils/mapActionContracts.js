function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;

    Object.values(value).forEach((nestedValue) => deepFreeze(nestedValue));
    return Object.freeze(value);
}

export const MAP_ACTION_CONTRACTS = deepFreeze({
    setZoom: {
        invocation: { type: "payload" },
        required: ["level"],
        payload: {
            level: "number",
            options: {
                externalOverride: "boolean",
            },
        },
    },
    flyTo: {
        invocation: { type: "payload" },
        required: ["latLng"],
        payload: {
            latLng: "LatLng",
            zoom: "number",
            options: {
                showMarker: "boolean",
                externalOverride: "boolean",
                leaflet: "object",
            },
        },
    },
    teleportTo: {
        invocation: { type: "payload" },
        required: ["latLng"],
        payload: {
            latLng: "LatLng",
            zoom: "number",
            options: {
                externalOverride: "boolean",
                leaflet: "object",
            },
        },
    },
    panTo: {
        invocation: { type: "payload" },
        required: ["latLng"],
        payload: {
            latLng: "LatLng",
            options: {
                externalOverride: "boolean",
                leaflet: "object",
            },
        },
    },
    drawShape: {
        invocation: { type: "payload" },
        transactional: false,
        required: ["shape"],
        payload: {
            shape: "polygon|circle|rectangle|delete|cancel|clear",
        },
    },
    setEraserMode: {
        invocation: { type: "payload" },
        transactional: false,
        required: ["active"],
        payload: {
            active: "boolean",
        },
    },
    addLayer: {
        invocation: { type: "payload" },
        required: ["id", "type", "source"],
        payload: {
            id: "string",
            type: "string",
            source: "object",
            sourceLayer: "string",
            visibleColumns: "array",
            renderState: "object",
            request: "object",
            auth: "object",
            name: "string",
            visible: "boolean",
            opacity: "number",
            order: "number",
        },
    },
    removeLayer: {
        invocation: { type: "payload" },
        required: ["layerId"],
        payload: {
            layerId: "string",
        },
    },
    setLayerRenderState: {
        invocation: { type: "payload" },
        required: ["layerId", "renderState"],
        payload: {
            layerId: "string",
            renderState: "object",
        },
    },
    setLayerVisibility: {
        invocation: { type: "payload" },
        required: ["layerId", "visible"],
        payload: {
            layerId: "string",
            visible: "boolean",
        },
    },
    configureMapZoom: {
        invocation: { type: "payload" },
        required: [],
        payload: {
            minZoom: "number",
            maxZoom: "number",
            maxNativeZoom: "number",
        },
    },
});
