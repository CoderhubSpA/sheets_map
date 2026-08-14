import { normalizeVectorTileLegendConfig } from './config.js'
import { serializeVectorTileLegendDraft } from './editor.js'
import { buildPointShapeIconExpression } from './icon.js'
import { buildVectorTileSemanticRenderState } from './style.js'

export const VECTOR_TILE_PREVIEW_SOURCE_ID = 'vector-tile-preview-source'

function normalizeCoordinatePair(value) {
    if (!Array.isArray(value) || value.length !== 2) return null
    const pair = value.map(Number)
    if (!pair.every(Number.isFinite)) return null
    if (pair[0] < -180 || pair[0] > 180 || pair[1] < -90 || pair[1] > 90) return null
    return pair
}

function normalizeBoundingBox(value) {
    if (!Array.isArray(value) || value.length !== 4) return null
    const bbox = value.map(Number)
    if (!bbox.every(Number.isFinite)) return null
    const [minX, minY, maxX, maxY] = bbox
    if (minX < -180 || maxX > 180 || minY < -90 || maxY > 90) return null
    if (minX > maxX || minY > maxY) return null
    return bbox
}

/**
 * Normaliza el contexto espacial aditivo entregado por attributes/legend.
 * Se acepta una lista de fuentes para conservar el último contexto válido
 * durante las recargas asíncronas del atributo.
 */
export function normalizeVectorTileSpatialContext(...sources) {
    let bbox = null
    let centroid = null

    sources.filter(Boolean).forEach(source => {
        if (!bbox) bbox = normalizeBoundingBox(source.bbox)
        if (!centroid) centroid = normalizeCoordinatePair(source.centroid)
    })

    if (!centroid && bbox) {
        centroid = [
            (bbox[0] + bbox[2]) / 2,
            (bbox[1] + bbox[3]) / 2,
        ]
    }

    return { bbox, centroid }
}

function semanticLegendFromDraft(draft = {}, semanticLegend = null) {
    const base = semanticLegend && typeof semanticLegend === 'object' ? semanticLegend : {}
    const items = Array.isArray(draft.items) ? draft.items : []
    const numeric = ['numeric', 'numerical'].includes(String(draft.legendType || '').toLowerCase())

    return {
        ...base,
        layer_name: draft.layerName,
        geometry_type: draft.geometryType,
        attribute: draft.attribute || null,
        legend_type: draft.legendType || base.legend_type || 'categorical',
        classes: numeric ? [] : items.map(item => ({
            key: String(item.key),
            label: item.label || String(item.key),
            count: item.count ?? null,
        })),
        ranges: numeric ? items.map(item => ({
            key: String(item.key),
            min_value: item.minValue,
            max_value: item.maxValue,
            label: item.label || String(item.key),
            count: item.count ?? null,
        })) : [],
    }
}

/**
 * Construye el mismo estado que consume VectorTileLayer. El preview no mantiene
 * un segundo contrato visual: serializa el draft y vuelve a entrar por el
 * normalizador/renderizador de producción.
 */
export function buildVectorTilePreviewRenderState(draft, layer = {}, semanticLegend = null) {
    const hasThematicDefinition = draft.mode !== 'thematic'
        || (Boolean(draft.attribute) && Array.isArray(draft.items) && draft.items.length > 0)
    const renderDraft = hasThematicDefinition
        ? draft
        : { ...draft, mode: 'simple' }
    const serialized = serializeVectorTileLegendDraft(renderDraft)
    const previewLayer = {
        ...layer,
        id: layer.id ?? 'vector-tile-preview',
        name: draft.title || layer.value || layer.name || draft.layerName || 'Capa',
        sh_map_has_layer_geoserver_layer: draft.layerName,
        sh_map_has_layer_legend_config: JSON.stringify(serialized),
    }
    const config = normalizeVectorTileLegendConfig(previewLayer)

    const renderState = buildVectorTileSemanticRenderState({
        layer: previewLayer,
        config,
        semanticLegend: renderDraft.mode === 'simple'
            ? {}
            : semanticLegendFromDraft(draft, semanticLegend),
    })

    // En modo temático todavía sin atributo, la cartografía debe reaccionar a
    // los controles generales sin inventar una leyenda antes de tiempo.
    return hasThematicDefinition
        ? renderState
        : { ...renderState, legend: null }
}

/**
 * Una única capa MapLibre por tipo de geometría evita multiplicar features por
 * cada clase. Las expresiones `match`/`case` eligen el estilo en GPU.
 */
export function buildVectorTilePreviewLayers(sourceLayer, paint, sourceId = VECTOR_TILE_PREVIEW_SOURCE_ID) {
    const resolvedPaint = {
        polygonFillOpacityExpression: 0.6,
        polygonBorderEnabled: true,
        polygonStrokeWidthExpression: 2,
        polygonStrokeOpacityExpression: 0.8,
        lineWidthExpression: 2.5,
        lineOpacityExpression: 0.85,
        lineDashArray: [1, 0],
        pointRadiusExpression: 3,
        pointStrokeWidthExpression: 3,
        pointStrokeOpacityExpression: 1,
        circleOpacityExpression: 1,
        iconOpacityExpression: 1,
        useSymbolForPointShape: false,
        legendItems: [],
        legendAttribute: null,
        defaultFillColor: '#3388ff',
        defaultStrokeColor: '#286ac7',
        pointDashStyle: 'solid',
        ...paint,
    }
    const polygonBorderVisible = resolvedPaint.polygonBorderEnabled !== false
        && Number(resolvedPaint.polygonStrokeWidthExpression) !== 0
    const sourceLayerDefinition = sourceLayer ? { 'source-layer': sourceLayer } : {}

    return [
        {
            id: 'preview-polygon-fill',
            type: 'fill',
            source: sourceId,
            ...sourceLayerDefinition,
            filter: ['==', '$type', 'Polygon'],
            paint: {
                'fill-color': resolvedPaint.fillColorExpression,
                'fill-opacity': resolvedPaint.polygonFillOpacityExpression,
            },
        },
        {
            id: 'preview-polygon-border',
            type: 'line',
            source: sourceId,
            ...sourceLayerDefinition,
            filter: ['==', '$type', 'Polygon'],
            paint: {
                'line-color': resolvedPaint.strokeColorExpression,
                'line-width': polygonBorderVisible ? resolvedPaint.polygonStrokeWidthExpression : 0,
                'line-opacity': polygonBorderVisible ? resolvedPaint.polygonStrokeOpacityExpression : 0,
                'line-dasharray': resolvedPaint.lineDashArray,
            },
        },
        {
            id: 'preview-line',
            type: 'line',
            source: sourceId,
            ...sourceLayerDefinition,
            filter: ['==', '$type', 'LineString'],
            paint: {
                'line-color': resolvedPaint.fillColorExpression,
                'line-width': resolvedPaint.lineWidthExpression,
                'line-opacity': resolvedPaint.lineOpacityExpression,
                'line-dasharray': resolvedPaint.lineDashArray,
            },
        },
        {
            id: 'preview-point',
            type: 'circle',
            source: sourceId,
            ...sourceLayerDefinition,
            filter: ['==', '$type', 'Point'],
            paint: {
                'circle-radius': resolvedPaint.pointRadiusExpression,
                'circle-color': resolvedPaint.fillColorExpression,
                'circle-stroke-width': resolvedPaint.pointStrokeWidthExpression,
                'circle-stroke-color': resolvedPaint.strokeColorExpression,
                // `circle-opacity` solo oculta el relleno. El contorno tiene una
                // opacidad independiente y también debe apagarse al usar símbolos.
                'circle-stroke-opacity': resolvedPaint.useSymbolForPointShape
                    ? 0
                    : resolvedPaint.pointStrokeOpacityExpression,
                'circle-opacity': resolvedPaint.useSymbolForPointShape
                    ? 0
                    : resolvedPaint.circleOpacityExpression,
            },
        },
        {
            id: 'preview-point-symbol',
            type: 'symbol',
            source: sourceId,
            ...sourceLayerDefinition,
            filter: ['==', '$type', 'Point'],
            layout: {
                'icon-image': buildPointShapeIconExpression(
                    resolvedPaint.legendAttribute,
                    resolvedPaint.legendItems,
                    resolvedPaint.defaultFillColor,
                    resolvedPaint.defaultStrokeColor,
                    resolvedPaint.pointDashStyle,
                ),
                'icon-size': ['/', resolvedPaint.pointRadiusExpression, 32],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
            },
            paint: {
                'icon-opacity': resolvedPaint.useSymbolForPointShape
                    ? resolvedPaint.iconOpacityExpression
                    : 0,
            },
        },
    ]
}
