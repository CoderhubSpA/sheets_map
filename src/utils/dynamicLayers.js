const DYNAMIC_VECTOR_TILE_CODE = "operative_vector_tiles_xyz";

function normalizeId(rawId) {
    if (typeof rawId !== "string") {
        return "";
    }

    return rawId.trim();
}

function normalizeString(value, fallback = "") {
    if (typeof value !== "string") {
        return fallback;
    }

    return value.trim();
}

function normalizeSourceLayer(value) {
    return normalizeString(value);
}

function normalizeSource(definition) {
    const source = definition && typeof definition === "object" ? definition : {};
    const tiles = Array.isArray(source.tiles)
        ? source.tiles
              .map((tile) => normalizeString(tile))
              .filter((tile) => tile.length > 0)
        : [];

    return {
        tiles,
        maxNativeZoom: normalizeNumber(source.maxNativeZoom ?? source.maxzoom, null),
    };
}

function normalizeRequest(rawRequest = null) {
    if (!rawRequest || typeof rawRequest !== "object") {
        return { headers: {} };
    }

    const headers = rawRequest.headers && typeof rawRequest.headers === "object"
        ? Object.entries(rawRequest.headers).reduce((acc, [key, value]) => {
            const normalizedKey = normalizeString(key);
            const normalizedValue = normalizeString(value);
            if (normalizedKey && normalizedValue) acc[normalizedKey] = normalizedValue;
            return acc;
        }, {})
        : {};

    return { headers };
}

function normalizeAuth(rawAuth = null) {
    if (!rawAuth || typeof rawAuth !== "object") {
        return { mode: "" };
    }

    return {
        mode: normalizeString(rawAuth.mode).toLowerCase(),
    };
}

function normalizeVisibleColumns(rawColumns = []) {
    if (!Array.isArray(rawColumns)) return [];

    return rawColumns
        .map((column) => {
            if (!column) return null;

            if (typeof column === "string") {
                return { id: column, name: column, format: "" };
            }

            if (typeof column === "object") {
                const id = normalizeId(column.id || column.key || column.value);
                if (!id) return null;

                return {
                    id,
                    name: normalizeString(column.name || column.label, id),
                    format: normalizeString(column.format),
                    ...column,
                };
            }

            return null;
        })
        .filter((column) => column !== null);
}

function normalizeRenderState(rawRenderState = null) {
    if (!rawRenderState || typeof rawRenderState !== "object") return null;

    const renderState = {
        ...rawRenderState,
    };

    if (!renderState.styleExpressions || typeof renderState.styleExpressions !== "object") {
        return null;
    }

    return renderState;
}

function normalizeLegendMode(rawLegendMode) {
    const mode = normalizeString(rawLegendMode, "external").toLowerCase();
    if (["internal", "external", "none"].includes(mode)) return mode;
    return "external";
}

function normalizeBoolean(value, fallback = true) {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return fallback;
}

function normalizeNumber(value, fallback = null) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
}

function normalizeVectorTileDefinition(rawDefinition) {
    const source = normalizeSource(rawDefinition.source);
    const tileUrl = source.tiles[0] || "";

    return {
        id: normalizeId(rawDefinition.id),
        type: "vector-tile",
        source: {
            ...source,
            tiles: [tileUrl],
        },
        sourceLayer: normalizeSourceLayer(rawDefinition.sourceLayer),
        attribution: normalizeString(rawDefinition.attribution, ""),
        visibleColumns: normalizeVisibleColumns(rawDefinition.visibleColumns || []),
        legendMode: normalizeLegendMode(rawDefinition.legendMode),
        renderState: normalizeRenderState(rawDefinition.renderState),
        request: normalizeRequest(rawDefinition.request),
        auth: normalizeAuth(rawDefinition.auth),
        name: normalizeString(rawDefinition.name, normalizeId(rawDefinition.id)),
        visible: normalizeBoolean(rawDefinition.visible, true),
        opacity: normalizeNumber(rawDefinition.opacity, null),
        order: normalizeNumber(rawDefinition.order, null),
        maxNativeZoom: normalizeNumber(rawDefinition.maxNativeZoom, source.maxNativeZoom),
    };
}

export function normalizePublicLayerPatch(rawPatch = {}) {
    if (!rawPatch || typeof rawPatch !== "object") return {};

    const patch = {};

    if (Object.prototype.hasOwnProperty.call(rawPatch, "name")) {
        patch.name = normalizeString(rawPatch.name);
    }
    if (Object.prototype.hasOwnProperty.call(rawPatch, "source")) {
        patch.source = normalizeSource(rawPatch.source);
    }
    if (Object.prototype.hasOwnProperty.call(rawPatch, "sourceLayer")) {
        patch.sourceLayer = normalizeSourceLayer(rawPatch.sourceLayer);
    }
    if (Object.prototype.hasOwnProperty.call(rawPatch, "attribution")) {
        patch.attribution = normalizeString(rawPatch.attribution, "");
    }
    if (Object.prototype.hasOwnProperty.call(rawPatch, "visibleColumns")) {
        patch.visibleColumns = normalizeVisibleColumns(rawPatch.visibleColumns || []);
    }
    if (Object.prototype.hasOwnProperty.call(rawPatch, "legendMode")) {
        patch.legendMode = normalizeLegendMode(rawPatch.legendMode);
    }
    if (Object.prototype.hasOwnProperty.call(rawPatch, "renderState")) {
        patch.renderState = normalizeRenderState(rawPatch.renderState);
    }
    if (Object.prototype.hasOwnProperty.call(rawPatch, "request")) {
        patch.request = normalizeRequest(rawPatch.request);
    }
    if (Object.prototype.hasOwnProperty.call(rawPatch, "visible")) {
        patch.visible = normalizeBoolean(rawPatch.visible, true);
    }
    if (Object.prototype.hasOwnProperty.call(rawPatch, "opacity")) {
        patch.opacity = normalizeNumber(rawPatch.opacity, null);
    }
    if (Object.prototype.hasOwnProperty.call(rawPatch, "order")) {
        patch.order = normalizeNumber(rawPatch.order, null);
    }

    return patch;
}

export function applyPublicLayerPatch(definition, rawPatch = {}) {
    const patch = normalizePublicLayerPatch(rawPatch);
    const merged = {
        ...definition,
        ...patch,
        source: patch.source ? { ...definition.source, ...patch.source } : definition.source,
    };

    if (definition.type === "vector-tile") {
        assertVectorTileSourceLayer(merged);
    }

    return merged;
}

function assertVectorTileSourceLayer(definition) {
    if (!definition.id) {
        throw new Error("La definición requiere un id de capa válido.");
    }

    if (!definition.source || definition.source.tiles.length === 0) {
        throw new Error(
            `La capa ${definition.id} debe incluir source.tiles con al menos una URL válida de tiles.`,
        );
    }
}

export function normalizePublicLayerDefinition(rawDefinition) {
    const type = normalizeString(rawDefinition && rawDefinition.type).toLowerCase();

    switch (type) {
        case "vector-tile": {
            const definition = normalizeVectorTileDefinition(rawDefinition);
            assertVectorTileSourceLayer(definition);
            return definition;
        }
        default: {
            throw new Error(
                `Tipo de capa no soportado por addLayer: ${rawDefinition && rawDefinition.type}`,
            );
        }
    }
}

export function buildVectorTileLayerPayload(normalizedLayerDefinition) {
    return {
        layer_id: normalizedLayerDefinition.id,
        layer: {
            id: normalizedLayerDefinition.id,
            name: normalizedLayerDefinition.name,
            sh_map_has_layer_code: DYNAMIC_VECTOR_TILE_CODE,
            sh_map_has_layer_type: "vector-tile",
            sh_map_has_layer_url: normalizedLayerDefinition.source.tiles[0],
            sh_map_has_layer_attribution: normalizedLayerDefinition.attribution,
            visible_columns: normalizedLayerDefinition.visibleColumns,
            entity_type_id: "",
            sh_map_has_layer_vector_source_layer: normalizedLayerDefinition.sourceLayer,
            sh_map_has_layer_legend_mode: normalizedLayerDefinition.legendMode,
            sh_map_has_layer_render_state: normalizedLayerDefinition.renderState,
            sh_map_has_layer_max_native_zoom: normalizedLayerDefinition.maxNativeZoom,
            sh_map_request_headers: normalizedLayerDefinition.request?.headers || {},
            sh_map_request_auth_mode: normalizedLayerDefinition.auth?.mode || "",
            sh_map_has_layer_visible: normalizedLayerDefinition.visible,
            sh_map_has_layer_opacity: normalizedLayerDefinition.opacity,
        },
        visible_columns: normalizedLayerDefinition.visibleColumns,
        entity_type_id: "",
        visible: normalizedLayerDefinition.visible,
        order: normalizedLayerDefinition.order,
        opacity: normalizedLayerDefinition.opacity,
        _dynamic: true,
        _uid: null,
    };
}

export const DYNAMIC_LAYER_TYPES = Object.freeze({
    VECTOR_TILE: "vector-tile",
});
