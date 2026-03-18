import { deriveStrokeColor, normalizeColorValue } from './palette'

const DEFAULT_FALLBACK_COLOR = '#3388FF'
const DEFAULT_NULL_COLOR = '#BDBDBD'
const DEFAULT_POINT_SIZE = 8
const DEFAULT_POINT_STROKE_WIDTH = 3
const SUPPORTED_POINT_SHAPES = ['circle', 'square', 'triangle', 'diamond']

function safeParseJson(value, fallbackValue = {}) {
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

    const fallbackSize = fallbackPointStyle?.size ?? DEFAULT_POINT_SIZE
    const fallbackStrokeWidth = fallbackPointStyle?.strokeWidth ?? DEFAULT_POINT_STROKE_WIDTH
    const fallbackShape = fallbackPointStyle?.shape ?? 'circle'

    return {
        size: normalizeNumber(rawPointStyle.size ?? rawPointStyle.point_size, fallbackSize, 1),
        strokeWidth: normalizeNumber(rawPointStyle.stroke_width ?? rawPointStyle.strokeWidth ?? rawPointStyle.point_stroke_width, fallbackStrokeWidth, 0),
        shape: normalizePointShape(rawPointStyle.shape ?? rawPointStyle.point_shape, fallbackShape),
    }
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
        const point = normalizePointStyle(item.point || item)

        accumulator[String(key)] = {
            fill: fillColor,
            stroke: strokeColor || fillColor,
            label: item.label || String(key),
            point,
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
        pointStyle,
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
