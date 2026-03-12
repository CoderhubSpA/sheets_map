import { buildAutomaticPaletteMap, deriveStrokeColor } from './palette'

const NULL_CLASS_KEY = '__VECTOR_TILE_NULL__'
const SUPPORTED_LEGEND_TYPES = ['categorical', 'boolean', 'numeric', 'numerical', 'text']
const DEFAULT_POINT_SIZE = 8
const DEFAULT_POINT_STROKE_WIDTH = 3

function createFeatureColorExpression(propertyNames, fallbackColor) {
    return [
        'coalesce',
        ...propertyNames.map(propertyName => ['get', propertyName]),
        fallbackColor,
    ]
}

function createAttributeMatchExpression(attribute, items, expressionKey, fallbackExpression) {
    if (!attribute || !Array.isArray(items) || items.length === 0) {
        return fallbackExpression
    }

    const expression = [
        'match',
        ['to-string', ['coalesce', ['get', attribute], NULL_CLASS_KEY]],
    ]

    items.forEach(item => {
        expression.push(item.expressionKey)
        expression.push(item[expressionKey])
    })

    expression.push(fallbackExpression)
    return expression
}

function createNumericRangeExpression(attribute, items, expressionKey, fallbackExpression) {
    if (!attribute || !Array.isArray(items) || items.length === 0) {
        return fallbackExpression
    }

    const valueExpression = ['to-number', ['get', attribute]]
    const expression = ['case']
    let hasAnyRangeCondition = false

    items.forEach(item => {
        const minValue = Number(item.minValue)
        const maxValue = Number(item.maxValue)
        const hasMin = Number.isFinite(minValue)
        const hasMax = Number.isFinite(maxValue)

        if (!hasMin && !hasMax) {
            return
        }

        let rangeCondition = null

        if (hasMin && hasMax) {
            rangeCondition = item.includeMax
                ? ['all', ['>=', valueExpression, minValue], ['<=', valueExpression, maxValue]]
                : ['all', ['>=', valueExpression, minValue], ['<', valueExpression, maxValue]]
        } else if (hasMin) {
            rangeCondition = ['>=', valueExpression, minValue]
        } else {
            rangeCondition = ['<=', valueExpression, maxValue]
        }

        expression.push(rangeCondition)
        expression.push(item[expressionKey])
        hasAnyRangeCondition = true
    })

    if (!hasAnyRangeCondition) {
        return fallbackExpression
    }

    expression.push(fallbackExpression)
    return expression
}

function resolveLegendItemColor({ configItem, legendClass, autoPaletteMap, config }) {
    if (configItem?.fill) {
        return {
            fill: configItem.fill,
            stroke: configItem.stroke || deriveStrokeColor(configItem.fill),
            source: 'manual',
        }
    }

    if (config.palette.strategy === 'auto') {
        const autoFillColor = autoPaletteMap[String(legendClass.key)] || config.palette.fallbackColor
        return {
            fill: autoFillColor,
            stroke: deriveStrokeColor(autoFillColor),
            source: 'auto',
        }
    }

    return {
        fill: config.palette.fallbackColor,
        stroke: deriveStrokeColor(config.palette.fallbackColor),
        source: 'fallback',
    }
}

function resolveLegendItemPointStyle(config, configItem) {
    const globalPointStyle = config.pointStyle || {
        size: DEFAULT_POINT_SIZE,
        strokeWidth: DEFAULT_POINT_STROKE_WIDTH,
        shape: 'circle',
    }
    const itemPointStyle = configItem?.point || {}

    return {
        size: Number.isFinite(Number(itemPointStyle.size)) ? Number(itemPointStyle.size) : globalPointStyle.size,
        strokeWidth: Number.isFinite(Number(itemPointStyle.strokeWidth)) ? Number(itemPointStyle.strokeWidth) : globalPointStyle.strokeWidth,
        shape: itemPointStyle.shape || globalPointStyle.shape || 'circle',
    }
}

function buildResolvedLegendItems(config, semanticLegend) {
    const classes = Array.isArray(semanticLegend.classes) ? semanticLegend.classes : []
    const autoPaletteMap = buildAutomaticPaletteMap(classes.map(legendClass => legendClass.key), config.palette.name)

    const resolvedItems = classes.map(legendClass => {
        const configItem = config.palette.items[String(legendClass.key)]
        const colors = resolveLegendItemColor({ configItem, legendClass, autoPaletteMap, config })
        const pointStyle = resolveLegendItemPointStyle(config, configItem)

        return {
            key: String(legendClass.key),
            expressionKey: String(legendClass.key),
            label: configItem?.label || legendClass.label || String(legendClass.key),
            count: legendClass.count,
            fill: colors.fill,
            stroke: colors.stroke,
            source: colors.source,
            pointSize: pointStyle.size,
            pointStrokeWidth: pointStyle.strokeWidth,
            pointShape: pointStyle.shape,
        }
    })

    if (semanticLegend.null_count > 0 && config.visibility.showUnclassified) {
        const nullPointStyle = config.pointStyle || {
            size: DEFAULT_POINT_SIZE,
            strokeWidth: DEFAULT_POINT_STROKE_WIDTH,
            shape: 'circle',
        }

        resolvedItems.push({
            key: NULL_CLASS_KEY,
            expressionKey: NULL_CLASS_KEY,
            label: 'Sin clasificación',
            count: semanticLegend.null_count,
            fill: config.palette.nullColor || config.palette.fallbackColor,
            stroke: deriveStrokeColor(config.palette.nullColor || config.palette.fallbackColor),
            source: 'null',
            pointSize: nullPointStyle.size,
            pointStrokeWidth: nullPointStyle.strokeWidth,
            pointShape: nullPointStyle.shape || 'circle',
        })
    }

    return resolvedItems
}

function buildResolvedNumericLegendItems(config, semanticLegend) {
    const ranges = Array.isArray(semanticLegend.ranges) ? semanticLegend.ranges : []
    const autoPaletteMap = buildAutomaticPaletteMap(
        ranges.map((range, index) => range.label || `${range.min_value}-${range.max_value}-${index}`),
        config.palette.name,
    )

    return ranges.reduce((accumulator, range, index) => {
        const rangeKey = String(range.label || `${range.min_value}-${range.max_value}-${index}`)
        const configItem = config.palette.items[rangeKey]
        const colors = resolveLegendItemColor({
            configItem,
            legendClass: { key: rangeKey },
            autoPaletteMap,
            config,
        })
        const pointStyle = resolveLegendItemPointStyle(config, configItem)

        accumulator.push({
            key: rangeKey,
            expressionKey: rangeKey,
            label: configItem?.label || range.label || rangeKey,
            count: range.count,
            fill: colors.fill,
            stroke: colors.stroke,
            source: colors.source,
            pointSize: pointStyle.size,
            pointStrokeWidth: pointStyle.strokeWidth,
            pointShape: pointStyle.shape,
            minValue: Number(range.min_value),
            maxValue: Number(range.max_value),
            includeMax: index === ranges.length - 1,
        })

        return accumulator
    }, [])
}

function buildResolvedTextLegendItems(layer, config, semanticLegend, defaultPaint) {
    const fillColor = config.palette.fallbackColor || defaultPaint.defaultFillColor
    const strokeColor = deriveStrokeColor(fillColor)
    const layerName = layer.name || semanticLegend.layer_name || config.layerName || 'Capa'
    const geometryLabel = semanticLegend.geometry_type === 'MultiLineString' || semanticLegend.geometry_type === 'LineString'
        ? 'Líneas'
        : (semanticLegend.geometry_type === 'Point' || semanticLegend.geometry_type === 'MultiPoint' ? 'Puntos' : 'Polígonos')

    return [
        {
            key: '__TEXT_FALLBACK__',
            expressionKey: '__TEXT_FALLBACK__',
            label: `${geometryLabel} — ${layerName}`,
            count: semanticLegend.sample_size || null,
            fill: fillColor,
            stroke: strokeColor,
            source: 'text-fallback',
            pointSize: config.pointStyle?.size || DEFAULT_POINT_SIZE,
            pointStrokeWidth: config.pointStyle?.strokeWidth || DEFAULT_POINT_STROKE_WIDTH,
            pointShape: config.pointStyle?.shape || 'circle',
        },
    ]
}

export function buildDefaultVectorTilePaint(layer = {}) {
    const defaultFillColor = layer.sh_map_has_layer_text_color || layer.sh_map_has_layer_color || '#3388ff'
    const defaultStrokeColor = layer.sh_map_has_layer_color || '#3388ff'

    return {
        defaultFillColor,
        defaultStrokeColor,
        fillColorExpression: createFeatureColorExpression(['Fill', 'fill', 'FILL'], defaultFillColor),
        strokeColorExpression: createFeatureColorExpression(['Stroke', 'stroke', 'STROKE'], defaultStrokeColor),
        pointRadiusExpression: DEFAULT_POINT_SIZE,
        pointStrokeWidthExpression: DEFAULT_POINT_STROKE_WIDTH,
        pointShapeExpression: 'circle',
        useSymbolForPointShape: false,
    }
}

export function buildVectorTileSemanticRenderState({ layer, config, semanticLegend }) {
    const defaultPaint = buildDefaultVectorTilePaint(layer)
    const legendType = String(semanticLegend?.legend_type || '').toLowerCase()

    if (!config || !semanticLegend) {
        return {
            styleExpressions: defaultPaint,
            legend: null,
        }
    }

    if (!SUPPORTED_LEGEND_TYPES.includes(legendType) || !config.attribute) {
        return {
            styleExpressions: defaultPaint,
            legend: null,
        }
    }

    const isNumericLegend = legendType === 'numeric' || legendType === 'numerical'
    const isTextLegend = legendType === 'text'
    const items = isNumericLegend
        ? buildResolvedNumericLegendItems(config, semanticLegend)
        : (isTextLegend
            ? buildResolvedTextLegendItems(layer, config, semanticLegend, defaultPaint)
            : buildResolvedLegendItems(config, semanticLegend))

    if (items.length === 0) {
        return {
            styleExpressions: defaultPaint,
            legend: null,
        }
    }

    const hasCustomPointShape = items.some(item => item.pointShape && item.pointShape !== 'circle')

    return {
        styleExpressions: {
            ...defaultPaint,
            fillColorExpression: isNumericLegend
                ? createNumericRangeExpression(config.attribute, items, 'fill', defaultPaint.fillColorExpression)
                : createAttributeMatchExpression(config.attribute, items, 'fill', defaultPaint.fillColorExpression),
            strokeColorExpression: isNumericLegend
                ? createNumericRangeExpression(config.attribute, items, 'stroke', defaultPaint.strokeColorExpression)
                : createAttributeMatchExpression(config.attribute, items, 'stroke', defaultPaint.strokeColorExpression),
            pointRadiusExpression: isNumericLegend
                ? createNumericRangeExpression(config.attribute, items, 'pointSize', defaultPaint.pointRadiusExpression)
                : createAttributeMatchExpression(config.attribute, items, 'pointSize', defaultPaint.pointRadiusExpression),
            pointStrokeWidthExpression: isNumericLegend
                ? createNumericRangeExpression(config.attribute, items, 'pointStrokeWidth', defaultPaint.pointStrokeWidthExpression)
                : createAttributeMatchExpression(config.attribute, items, 'pointStrokeWidth', defaultPaint.pointStrokeWidthExpression),
            pointShapeExpression: isNumericLegend
                ? createNumericRangeExpression(config.attribute, items, 'pointShape', defaultPaint.pointShapeExpression)
                : createAttributeMatchExpression(config.attribute, items, 'pointShape', defaultPaint.pointShapeExpression),
            useSymbolForPointShape: hasCustomPointShape,
            legendItems: items,
            legendAttribute: config.attribute,
        },
        legend: {
            title: config.legendTitle || layer.name,
            attribute: semanticLegend.attribute || config.attribute,
            legendType,
            geometryType: semanticLegend.geometry_type,
            items,
            nullCount: semanticLegend.null_count,
            sampleSize: semanticLegend.sample_size,
            visible: config.visibility.showInMapLegend !== false,
        },
        sourceLayerHint: semanticLegend.layer_name || config.layerName || null,
    }
}
