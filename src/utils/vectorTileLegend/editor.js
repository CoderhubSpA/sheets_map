import { deriveStrokeColor, normalizeColorValue } from './palette.js'
import { normalizeVectorTileLegendConfig } from './config.js'
import { LEGACY_TEXT_CLASS_KEY, TEXT_CLASS_KEY } from './constants.js'

export const VECTOR_TILE_CODE = 'operative_vector_tiles_xyz'
export const DASH_STYLES = ['solid', 'dashed', 'dotted']
export const POINT_SHAPES = ['circle', 'square', 'triangle', 'diamond']
export const VECTOR_TILE_STYLE_LIMITS = Object.freeze({
    fillOpacity: { min: 0, max: 1, fallback: 0.6 },
    strokeWidth: { min: 0, max: 20, fallback: 2 },
    strokeOpacity: { min: 0, max: 1, fallback: 0.8 },
    lineWidth: { min: 0, max: 20, fallback: 2.5 },
    lineOpacity: { min: 0, max: 1, fallback: 0.85 },
    pointSize: { min: 1, max: 64, fallback: 3 },
    pointStrokeWidth: { min: 0, max: 16, fallback: 3 },
})

const DEFAULT_COLORS = [
    '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
    '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC',
]

function clamp(value, min, max, fallback) {
    const number = Number(value)
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

export function normalizeVectorTileStyleValue(key, value, fallbackValue) {
    const limits = VECTOR_TILE_STYLE_LIMITS[key]
    if (!limits) return Number(value)
    return clamp(value, limits.min, limits.max, fallbackValue ?? limits.fallback)
}

/**
 * Actualiza la base global sin tocar los overrides de cada clase. Las clases
 * sin personalización heredan el nuevo valor y las configuradas conservan
 * siempre prioridad sobre el estilo general.
 */
export function applyGlobalVectorTileStyleUpdate(draft = {}, key, value) {
    return {
        ...draft,
        [key]: value,
    }
}

function clone(value) {
    return JSON.parse(JSON.stringify(value))
}

function isFiniteNumberValue(value) {
    return value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value))
}

export function isVectorTileSymbologyEligible(layer = {}) {
    return layer.sh_map_has_layer_code === VECTOR_TILE_CODE || layer.code === VECTOR_TILE_CODE
}

export function createVectorTileLegendDraft(layer = {}, defaultLegend = null) {
    const config = normalizeVectorTileLegendConfig(layer)
    const geometryType = config?.geometryType || defaultLegend?.geometry_type || 'Polygon'
    const layerTitle = [
        layer.value,
        layer.name,
        layer.sh_map_has_layer_name,
        layer.sh_map_has_layer_geoserver_layer,
    ].find(value => typeof value === 'string' && value.trim()) || ''
    const configuredItems = Object.entries(config?.palette?.items || {}).map(([key, item]) => ({
        key: key === LEGACY_TEXT_CLASS_KEY ? TEXT_CLASS_KEY : key,
        label: item.label || key,
        fill: item.fill || config.palette.fallbackColor,
        stroke: item.stroke || config.palette.fallbackColor,
        point: item.point || {},
        style: item.style || {},
        minValue: item.minValue,
        maxValue: item.maxValue,
    }))

    const fallbackColor = config?.palette?.fallbackColor || layer.sh_map_has_layer_text_color || layer.sh_map_has_layer_color || '#3388FF'
    return {
        mode: config?.mode === 'manual' ? 'simple' : 'thematic',
        layerName: config?.layerName || layer.sh_map_has_layer_geoserver_layer || '',
        geometryType,
        attribute: config?.attribute || '',
        legendType: config?.palette?.type || 'categorical',
        title: config?.legendTitle || layerTitle,
        description: config?.description || '',
        fallbackColor,
        strokeColor: config?.palette?.items?.__SIMPLE__?.stroke || deriveStrokeColor(fallbackColor),
        nullColor: config?.palette?.nullColor || '#BDBDBD',
        fillOpacity: normalizeVectorTileStyleValue('fillOpacity', config?.style?.fillOpacity ?? 0.6),
        borderEnabled: config?.style?.borderEnabled !== false,
        strokeWidth: normalizeVectorTileStyleValue('strokeWidth', config?.style?.strokeWidth ?? 2),
        strokeOpacity: normalizeVectorTileStyleValue('strokeOpacity', config?.style?.strokeOpacity ?? 0.8),
        lineWidth: normalizeVectorTileStyleValue('lineWidth', config?.style?.lineWidth ?? 2.5),
        lineOpacity: normalizeVectorTileStyleValue('lineOpacity', config?.style?.lineOpacity ?? 0.85),
        dashStyle: config?.style?.dashStyle || 'solid',
        pointShape: config?.pointStyle?.shape || 'circle',
        pointSize: normalizeVectorTileStyleValue('pointSize', config?.pointStyle?.size ?? 3),
        pointStrokeWidth: normalizeVectorTileStyleValue('pointStrokeWidth', config?.pointStyle?.strokeWidth ?? 3),
        pointImage: layer.sh_map_has_layer_point_image || layer.pointImage || null,
        items: configuredItems,
        rangesContinuous: config?.rangesContinuous === true,
        showInMapLegend: config?.visibility?.showInMapLegend !== false,
        showUnclassified: config?.visibility?.showUnclassified !== false,
    }
}

export function applySemanticLegendToDraft(draft, semanticLegend = {}) {
    const next = clone(draft)
    const legendType = String(semanticLegend.legend_type || 'text').toLowerCase()
    const previousItems = new Map((next.items || []).map(item => [String(item.key), item]))
    if (previousItems.has(LEGACY_TEXT_CLASS_KEY) && !previousItems.has(TEXT_CLASS_KEY)) {
        previousItems.set(TEXT_CLASS_KEY, previousItems.get(LEGACY_TEXT_CLASS_KEY))
    }
    const numericRangeKeyOccurrences = new Map()
    let sourceItems = legendType === 'numeric' || legendType === 'numerical'
        ? (semanticLegend.ranges || []).map((range, index) => {
            const baseKey = String(range.key ?? range.label ?? `${range.min_value}-${range.max_value}`)
            const occurrence = numericRangeKeyOccurrences.get(baseKey) || 0
            numericRangeKeyOccurrences.set(baseKey, occurrence + 1)

            // GeoServer redondea los labels visibles. En capas con poca
            // dispersión, dos rangos distintos pueden terminar con el mismo
            // texto; la clave interna debe seguir siendo única para no perder
            // colores ni overrides durante la serialización.
            const key = occurrence === 0
                ? baseKey
                : `${baseKey}__range_${index}_${range.min_value}_${range.max_value}`

            return {
                key,
                legacyKey: baseKey,
                label: range.label || `${range.min_value} - ${range.max_value}`,
                minValue: Number(range.min_value),
                maxValue: Number(range.max_value),
                count: range.count,
            }
        })
        : (semanticLegend.classes || []).map(item => ({
            key: String(item.key),
            label: item.label || String(item.key),
            count: item.count,
        }))
    if (legendType === 'text' && sourceItems.length === 0) {
        sourceItems = [{
            key: TEXT_CLASS_KEY,
            label: semanticLegend.label || next.title || 'Elementos',
            count: semanticLegend.sample_size ?? null,
        }]
    }

    next.geometryType = semanticLegend.geometry_type || next.geometryType
    next.legendType = legendType
    const isPointGeometry = String(next.geometryType || '').toLowerCase().includes('point')
    if (legendType === 'numeric' || legendType === 'numerical') {
        next.rangesContinuous = sourceItems.length > 1 && sourceItems.every((item, index) => (
            index === sourceItems.length - 1 || item.maxValue === sourceItems[index + 1].minValue
        ))
    }
    next.items = sourceItems.map((item, index) => {
        const previous = previousItems.get(item.key) || previousItems.get(item.legacyKey)
        const fill = previous?.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
        const sourceItem = { ...item }
        delete sourceItem.legacyKey
        return {
            ...sourceItem,
            label: previous?.label || item.label,
            fill,
            stroke: previous?.stroke || (isPointGeometry ? deriveStrokeColor(fill) : next.strokeColor),
            minValue: previous?.minValue ?? item.minValue,
            maxValue: previous?.maxValue ?? item.maxValue,
            point: previous?.point || {},
            style: previous?.style || {},
        }
    })
    return next
}

export function validateVectorTileLegendDraft(draft = {}) {
    const errors = []
    if (!draft.layerName) errors.push('La capa de GeoServer es obligatoria.')
    if (!draft.title?.trim()) errors.push('El título de la leyenda es obligatorio.')
    if (draft.mode === 'thematic' && !draft.attribute) errors.push('Selecciona un atributo para la simbología temática.')
    if (draft.mode === 'thematic' && (!Array.isArray(draft.items) || draft.items.length === 0)) {
        errors.push('El atributo seleccionado no devolvió clases configurables.')
    }
    Object.entries(VECTOR_TILE_STYLE_LIMITS).forEach(([key, limits]) => {
        const value = Number(draft[key])
        if (!Number.isFinite(value) || value < limits.min || value > limits.max) {
            errors.push(`El valor de ${key} debe estar entre ${limits.min} y ${limits.max}.`)
        }
    })
    ;(draft.items || []).forEach((item, itemIndex) => {
        Object.entries(VECTOR_TILE_STYLE_LIMITS).forEach(([key, limits]) => {
            const itemValue = key === 'pointSize'
                ? item.point?.size
                : (key === 'pointStrokeWidth' ? item.point?.strokeWidth : item.style?.[key])
            if (itemValue === undefined || itemValue === null || itemValue === '') return
            const value = Number(itemValue)
            if (!Number.isFinite(value) || value < limits.min || value > limits.max) {
                errors.push(`El valor de ${key} en la clase ${itemIndex + 1} debe estar entre ${limits.min} y ${limits.max}.`)
            }
        })
    })
    if (draft.mode === 'thematic' && ['numeric', 'numerical'].includes(String(draft.legendType).toLowerCase())) {
        const ranges = draft.items || []
        ranges.forEach((range, index) => {
            const min = Number(range.minValue)
            const max = Number(range.maxValue)
            if (!isFiniteNumberValue(range.minValue) || !isFiniteNumberValue(range.maxValue)) {
                errors.push(`El rango ${index + 1} debe tener límites numéricos válidos.`)
            } else if (min > max) {
                errors.push(`El rango ${index + 1} tiene un mínimo mayor que el máximo.`)
            }
            if (index > 0) {
                const previousMin = Number(ranges[index - 1].minValue)
                const previousMax = Number(ranges[index - 1].maxValue)
                if (isFiniteNumberValue(ranges[index - 1].maxValue) && isFiniteNumberValue(range.minValue)) {
                    if (Number.isFinite(previousMin) && min < previousMin) {
                        errors.push(`Los rangos ${index} y ${index + 1} no están ordenados de menor a mayor.`)
                    } else if (min < previousMax) {
                        errors.push(`Los rangos ${index} y ${index + 1} se superponen.`)
                    } else if (draft.rangesContinuous && min > previousMax) {
                        errors.push(`Existe un hueco entre los rangos ${index} y ${index + 1}.`)
                    }
                }
            }
        })
    }
    return errors
}

export function serializeVectorTileLegendDraft(draft) {
    const items = {}
    ;(draft.items || []).forEach(item => {
        const normalized = {
            label: String(item.label || item.key),
            fill: normalizeColorValue(item.fill, draft.fallbackColor),
            stroke: normalizeColorValue(item.stroke, draft.strokeColor),
        }
        const point = {}
        if (item.point?.shape !== undefined) point.shape = POINT_SHAPES.includes(item.point.shape) ? item.point.shape : draft.pointShape
        if (item.point?.size !== undefined) point.size = clamp(item.point.size, 1, 64, draft.pointSize)
        if (item.point?.strokeWidth !== undefined) point.stroke_width = clamp(item.point.strokeWidth, 0, 16, draft.pointStrokeWidth)
        if (Object.keys(point).length) normalized.point = point

        const style = {}
        if (item.style?.fillOpacity !== undefined) style.fill_opacity = normalizeVectorTileStyleValue('fillOpacity', item.style.fillOpacity)
        if (item.style?.borderEnabled !== undefined) style.border_enabled = item.style.borderEnabled !== false
        if (item.style?.strokeWidth !== undefined) style.stroke_width = normalizeVectorTileStyleValue('strokeWidth', item.style.strokeWidth)
        if (item.style?.strokeOpacity !== undefined) style.stroke_opacity = normalizeVectorTileStyleValue('strokeOpacity', item.style.strokeOpacity)
        if (item.style?.lineWidth !== undefined) style.line_width = normalizeVectorTileStyleValue('lineWidth', item.style.lineWidth)
        if (item.style?.lineOpacity !== undefined) style.line_opacity = normalizeVectorTileStyleValue('lineOpacity', item.style.lineOpacity)
        if (item.style?.dashStyle !== undefined) style.dash_style = DASH_STYLES.includes(item.style.dashStyle) ? item.style.dashStyle : draft.dashStyle
        if (Object.keys(style).length) normalized.style = style
        if (isFiniteNumberValue(item.minValue)) normalized.min_value = Number(item.minValue)
        if (isFiniteNumberValue(item.maxValue)) normalized.max_value = Number(item.maxValue)
        const itemKey = item.key === LEGACY_TEXT_CLASS_KEY ? TEXT_CLASS_KEY : String(item.key)
        items[itemKey] = normalized
    })
    if (draft.mode === 'simple') {
        items.__SIMPLE__ = {
            label: String(draft.title || '').trim(),
            fill: normalizeColorValue(draft.fallbackColor, '#3388FF'),
            stroke: normalizeColorValue(draft.strokeColor, deriveStrokeColor(draft.fallbackColor)),
            point: {
                shape: POINT_SHAPES.includes(draft.pointShape) ? draft.pointShape : 'circle',
                size: clamp(draft.pointSize, 1, 64, 3),
                stroke_width: clamp(draft.pointStrokeWidth, 0, 16, 3),
            },
        }
    }

    return {
        vector_tile_legend: {
            version: 2,
            enabled: true,
            mode: draft.mode === 'simple' ? 'manual' : 'semantic',
            layer_name: draft.layerName,
            geometry_type: draft.geometryType,
            attribute: draft.mode === 'thematic' ? draft.attribute : null,
            legend_title: String(draft.title || '').trim(),
            description: String(draft.description || '').trim(),
            ranges_continuous: draft.rangesContinuous === true,
            palette: {
                type: draft.mode === 'simple' ? 'simple' : draft.legendType,
                strategy: 'manual',
                name: 'tableau10',
                fallback_color: normalizeColorValue(draft.fallbackColor, '#3388FF'),
                null_color: normalizeColorValue(draft.nullColor, '#BDBDBD'),
                items,
            },
            style: {
                fill_opacity: normalizeVectorTileStyleValue('fillOpacity', draft.fillOpacity),
                border_enabled: draft.borderEnabled !== false,
                stroke_width: normalizeVectorTileStyleValue('strokeWidth', draft.strokeWidth),
                stroke_opacity: normalizeVectorTileStyleValue('strokeOpacity', draft.strokeOpacity),
                line_width: normalizeVectorTileStyleValue('lineWidth', draft.lineWidth),
                line_opacity: normalizeVectorTileStyleValue('lineOpacity', draft.lineOpacity),
                dash_style: DASH_STYLES.includes(draft.dashStyle) ? draft.dashStyle : 'solid',
            },
            point_style: {
                shape: POINT_SHAPES.includes(draft.pointShape) ? draft.pointShape : 'circle',
                size: clamp(draft.pointSize, 1, 64, 3),
                stroke_width: clamp(draft.pointStrokeWidth, 0, 16, 3),
            },
            visibility: {
                show_in_map_legend: draft.showInMapLegend !== false,
                show_unclassified: draft.showUnclassified !== false,
            },
        },
    }
}

function sortObject(value) {
    if (Array.isArray(value)) return value.map(sortObject)
    if (!value || typeof value !== 'object') return value
    return Object.keys(value).sort().reduce((result, key) => {
        result[key] = sortObject(value[key])
        return result
    }, {})
}

export function stringifyVectorTileLegendConfig(draft) {
    return JSON.stringify(sortObject(serializeVectorTileLegendDraft(draft)), null, 2)
}
