import { deriveStrokeColor, normalizeColorValue } from './palette.js'

const DEFAULT_FALLBACK_COLOR = '#3388FF'
const DEFAULT_NULL_COLOR = '#BDBDBD'
const DEFAULT_POINT_SIZE = 3
const DEFAULT_POINT_STROKE_WIDTH = 3
const SUPPORTED_POINT_SHAPES = ['circle', 'square', 'triangle', 'diamond']

function safeParseJson(value, fallbackValue = {}) {
    if (value && typeof value === 'object') return value
    if (!value || typeof value !== 'string') return fallbackValue

    try {
        return JSON.parse(value)
    } catch (error) {
        console.warn('VectorTileLegend: No fue posible parsear la configuración de leyenda', error)
        return fallbackValue
    }
}

function normalizeNumber(value, fallbackValue, minValue = 0) {
    const parsedValue = Number(value)
    if (Number.isFinite(parsedValue) && parsedValue >= minValue) {
        return parsedValue
    }

    return fallbackValue
}

function normalizeOptionalNumber(value) {
    if (value === '' || value === null || value === undefined) return undefined
    const parsedValue = Number(value)
    return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function normalizeOptionalBoundedNumber(value, minValue, maxValue) {
    const normalized = normalizeOptionalNumber(value)
    if (normalized === undefined) return undefined
    return Math.min(maxValue, Math.max(minValue, normalized))
}

function normalizeItemStyle(rawStyle = {}) {
    if (!rawStyle || typeof rawStyle !== 'object') return {}
    const style = {}
    const fillOpacity = normalizeOptionalBoundedNumber(rawStyle.fill_opacity ?? rawStyle.fillOpacity, 0, 1)
    const strokeWidth = normalizeOptionalBoundedNumber(rawStyle.stroke_width ?? rawStyle.strokeWidth, 0, 20)
    const strokeOpacity = normalizeOptionalBoundedNumber(rawStyle.stroke_opacity ?? rawStyle.strokeOpacity, 0, 1)
    const lineWidth = normalizeOptionalBoundedNumber(rawStyle.line_width ?? rawStyle.lineWidth, 0, 20)
    const lineOpacity = normalizeOptionalBoundedNumber(rawStyle.line_opacity ?? rawStyle.lineOpacity, 0, 1)
    const dashStyle = rawStyle.dash_style ?? rawStyle.dashStyle

    if (fillOpacity !== undefined) style.fillOpacity = fillOpacity
    if (rawStyle.border_enabled !== undefined || rawStyle.borderEnabled !== undefined) {
        style.borderEnabled = (rawStyle.border_enabled ?? rawStyle.borderEnabled) !== false
    }
    if (strokeWidth !== undefined) style.strokeWidth = strokeWidth
    if (strokeOpacity !== undefined) style.strokeOpacity = strokeOpacity
    if (lineWidth !== undefined) style.lineWidth = lineWidth
    if (lineOpacity !== undefined) style.lineOpacity = lineOpacity
    if (['solid', 'dashed', 'dotted'].includes(dashStyle)) style.dashStyle = dashStyle
    return style
}

function normalizePointShape(shape, fallbackShape = 'circle') {
    const normalizedShape = String(shape || '').trim().toLowerCase()
    if (SUPPORTED_POINT_SHAPES.includes(normalizedShape)) {
        return normalizedShape
    }

    return fallbackShape
}

function normalizePointStyle(rawPointStyle = {}, fallbackPointStyle = null) {
    if (!rawPointStyle || typeof rawPointStyle !== 'object') {
        return fallbackPointStyle
    }

    const hasFallback = fallbackPointStyle !== null
    const fallbackSize = fallbackPointStyle?.size ?? DEFAULT_POINT_SIZE
    const fallbackStrokeWidth = fallbackPointStyle?.strokeWidth ?? DEFAULT_POINT_STROKE_WIDTH
    const fallbackShape = fallbackPointStyle?.shape ?? 'circle'
    const rawSize = rawPointStyle.size ?? rawPointStyle.point_size
    const rawStrokeWidth = rawPointStyle.stroke_width ?? rawPointStyle.strokeWidth ?? rawPointStyle.point_stroke_width
    const rawShape = rawPointStyle.shape ?? rawPointStyle.point_shape
    const point = {}

    if (rawSize !== undefined || hasFallback) point.size = normalizeNumber(rawSize, fallbackSize, 1)
    if (rawStrokeWidth !== undefined || hasFallback) point.strokeWidth = normalizeNumber(rawStrokeWidth, fallbackStrokeWidth, 0)
    if (rawShape !== undefined || hasFallback) point.shape = normalizePointShape(rawShape, fallbackShape)
    return point
}

function normalizeLegacyColorItems(legacyColors = {}) {
    return Object.entries(legacyColors || {}).reduce((accumulator, [key, fillColor]) => {
        const normalizedFillColor = normalizeColorValue(fillColor)
        if (!normalizedFillColor) return accumulator

        accumulator[String(key)] = {
            fill: normalizedFillColor,
            stroke: deriveStrokeColor(normalizedFillColor),
            label: String(key),
        }

        return accumulator
    }, {})
}

function normalizePaletteItems(paletteItems = {}, legacyColors = {}) {
    const normalizedLegacyItems = normalizeLegacyColorItems(legacyColors)
    const normalizedPaletteItems = Object.entries(paletteItems || {}).reduce((accumulator, [key, item]) => {
        if (typeof item === 'string') {
            const fillColor = normalizeColorValue(item)
            if (!fillColor) return accumulator

            accumulator[String(key)] = {
                fill: fillColor,
                stroke: deriveStrokeColor(fillColor),
                label: String(key),
            }

            return accumulator
        }

        if (!item || typeof item !== 'object') return accumulator

        const fillColor = normalizeColorValue(item.fill || item.color || item.background)
        const strokeColor = normalizeColorValue(item.stroke, fillColor ? deriveStrokeColor(fillColor) : null)
        const point = item.point && typeof item.point === 'object'
            ? normalizePointStyle(item.point)
            : null

        accumulator[String(key)] = {
            fill: fillColor,
            stroke: strokeColor || fillColor,
            label: item.label || String(key),
            point,
            style: normalizeItemStyle(item.style),
            minValue: normalizeOptionalNumber(item.min_value ?? item.minValue),
            maxValue: normalizeOptionalNumber(item.max_value ?? item.maxValue),
        }

        return accumulator
    }, {})

    return {
        ...normalizedLegacyItems,
        ...normalizedPaletteItems,
    }
}

export function inferVectorTileLayerNameFromUrl(tileUrl = '') {
    if (!tileUrl || typeof tileUrl !== 'string') return null

    const match = tileUrl.match(/\/vector\/tiles\/([^/?#]+)/)
    if (!match || !match[1]) return null

    try {
        return decodeURIComponent(match[1])
    } catch (error) {
        return match[1]
    }
}

export function normalizeVectorTileLegendConfig(layer = {}) {
    const parsedLegendConfig = safeParseJson(layer.sh_map_has_layer_legend_config, null)
    const legacyLegendConfig = safeParseJson(layer.sh_map_has_layer_custom_styles, null)
    const rawLegendConfig = parsedLegendConfig?.vector_tile_legend || legacyLegendConfig?.vector_tile_legend

    // Aceptar enabled: true (booleano) o enabled: 1 (número) para mayor compatibilidad
    if (!rawLegendConfig || rawLegendConfig.enabled !== true) {
        return null
    }

    const rawPalette = rawLegendConfig.palette || {}
    const paletteItems = normalizePaletteItems(rawPalette.items, rawLegendConfig.colors)
    const fallbackColor = normalizeColorValue(
        rawPalette.fallback_color || rawLegendConfig.fallback_color,
        layer.sh_map_has_layer_text_color || layer.sh_map_has_layer_color || DEFAULT_FALLBACK_COLOR,
    )
    const nullColor = normalizeColorValue(
        rawPalette.null_color || rawLegendConfig.null_color,
        DEFAULT_NULL_COLOR,
    )
    const pointStyle = normalizePointStyle(
        rawLegendConfig.point_style || rawPalette.point_style,
        {
            size: DEFAULT_POINT_SIZE,
            strokeWidth: DEFAULT_POINT_STROKE_WIDTH,
            shape: 'circle',
        },
    )

    return {
        version: Number(rawLegendConfig.version) || 1,
        enabled: true,
        mode: rawLegendConfig.mode || (rawLegendConfig.use_backend_legend === false ? 'manual' : 'semantic'),
        layerName: rawLegendConfig.layer_name || inferVectorTileLayerNameFromUrl(layer.sh_map_has_layer_url),
        attribute: rawLegendConfig.attribute || null,
        legendTitle: rawLegendConfig.legend_title || layer.name || null,
        description: rawLegendConfig.description || '',
        geometryType: rawLegendConfig.geometry_type || null,
        rangesContinuous: rawLegendConfig.ranges_continuous === true,
        pointStyle,
        style: {
            fillOpacity: normalizeNumber(rawLegendConfig.style?.fill_opacity, 0.6, 0),
            borderEnabled: rawLegendConfig.style?.border_enabled !== false,
            strokeWidth: normalizeNumber(rawLegendConfig.style?.stroke_width, 2, 0),
            strokeOpacity: normalizeNumber(rawLegendConfig.style?.stroke_opacity, 0.8, 0),
            lineWidth: normalizeNumber(rawLegendConfig.style?.line_width, 2.5, 0),
            lineOpacity: normalizeNumber(rawLegendConfig.style?.line_opacity, 0.85, 0),
            dashStyle: ['solid', 'dashed', 'dotted'].includes(rawLegendConfig.style?.dash_style)
                ? rawLegendConfig.style.dash_style
                : 'solid',
        },
        palette: {
            type: rawPalette.type || rawLegendConfig.palette_type || 'categorical',
            strategy: rawPalette.strategy || (Object.keys(paletteItems).length > 0 ? 'manual' : 'auto'),
            name: rawPalette.name || 'tableau10',
            fallbackColor,
            nullColor,
            items: paletteItems,
        },
        visibility: {
            showInMapLegend: rawLegendConfig.visibility?.show_in_map_legend !== false,
            showUnclassified: rawLegendConfig.visibility?.show_unclassified !== false,
        },
    }
}
