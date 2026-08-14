import { buildAutomaticPaletteMap, deriveStrokeColor } from './palette.js'
import { LEGACY_TEXT_CLASS_KEY, TEXT_CLASS_KEY } from './constants.js'

const NULL_CLASS_KEY = '__VECTOR_TILE_NULL__'
const SUPPORTED_LEGEND_TYPES = ['categorical', 'boolean', 'numeric', 'numerical', 'text']
const DEFAULT_POINT_SIZE = 3
const DEFAULT_POINT_STROKE_WIDTH = 3

function buildSemanticLegendFromConfig(config) {
    const legendType = String(config?.palette?.type || '').toLowerCase()
    const configuredItems = Object.entries(config?.palette?.items || {})
        .filter(([key]) => key !== '__SIMPLE__')
    const ranges = ['numeric', 'numerical'].includes(legendType)
        ? configuredItems
            .filter(([, item]) => Number.isFinite(item.minValue) && Number.isFinite(item.maxValue))
            .map(([key, item]) => ({
                key,
                label: item.label || key,
                min_value: item.minValue,
                max_value: item.maxValue,
                count: null,
            }))
        : []
    const classes = ranges.length === 0 && legendType !== 'text'
        ? configuredItems.map(([key, item]) => ({
            key,
            label: item.label || key,
            count: null,
        }))
        : []

    return {
        layer_name: config?.layerName || null,
        geometry_type: config?.geometryType || null,
        attribute: config?.attribute || null,
        legend_type: legendType,
        classes,
        ranges,
        null_count: 0,
        sample_size: null,
    }
}

function legendItemRangeKey(item) {
    const minValue = Number(item?.minValue)
    const maxValue = Number(item?.maxValue)

    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
        return null
    }

    return `${minValue}::${maxValue}`
}

/**
 * Enriquece una leyenda ya visible con cantidades obtenidas en segundo plano.
 *
 * El contenido persistido sigue siendo la fuente de verdad para etiquetas y
 * estilos. Del endpoint solo se incorporan cantidades, por lo que la leyenda
 * no cambia de estructura ni desaparece mientras llega la respuesta.
 */
export function mergeVectorTileLegendCounts(baseLegend, countedLegend) {
    if (!baseLegend || !Array.isArray(baseLegend.items) || !countedLegend) {
        return baseLegend
    }

    const countedItems = Array.isArray(countedLegend.items) ? countedLegend.items : []
    const countsByKey = new Map()
    const countsByRange = new Map()

    countedItems.forEach(item => {
        if (item?.key !== null && item?.key !== undefined) {
            countsByKey.set(String(item.key), item.count)
        }

        const rangeKey = legendItemRangeKey(item)
        if (rangeKey) {
            countsByRange.set(rangeKey, item.count)
        }
    })

    const items = baseLegend.items.map(item => {
        const itemKey = item?.key !== null && item?.key !== undefined
            ? String(item.key)
            : null
        const rangeKey = legendItemRangeKey(item)
        const hasKeyCount = itemKey !== null && countsByKey.has(itemKey)
        const hasRangeCount = rangeKey !== null && countsByRange.has(rangeKey)

        if (!hasKeyCount && !hasRangeCount) {
            return item
        }

        return {
            ...item,
            count: hasKeyCount ? countsByKey.get(itemKey) : countsByRange.get(rangeKey),
        }
    })

    return {
        ...baseLegend,
        items,
        nullCount: countedLegend.nullCount ?? baseLegend.nullCount,
        sampleSize: countedLegend.sampleSize ?? baseLegend.sampleSize,
    }
}

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

    const rawValueExpression = ['get', attribute]
    const hasClassifiableValue = [
        '!=',
        ['coalesce', rawValueExpression, NULL_CLASS_KEY],
        NULL_CLASS_KEY,
    ]
    const valueExpression = ['to-number', rawValueExpression]
    const expression = ['case']
    let hasAnyRangeCondition = false

    items.forEach(item => {
        if (item.key === NULL_CLASS_KEY) {
            expression.push(['==', ['coalesce', ['get', attribute], NULL_CLASS_KEY], NULL_CLASS_KEY])
            expression.push(item[expressionKey])
            hasAnyRangeCondition = true
            return
        }
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
                ? ['all', hasClassifiableValue, ['>=', valueExpression, minValue], ['<=', valueExpression, maxValue]]
                : ['all', hasClassifiableValue, ['>=', valueExpression, minValue], ['<', valueExpression, maxValue]]
        } else if (hasMin) {
            rangeCondition = ['all', hasClassifiableValue, ['>=', valueExpression, minValue]]
        } else {
            rangeCondition = ['all', hasClassifiableValue, ['<=', valueExpression, maxValue]]
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

        return withResolvedItemStyle({
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
        }, config, configItem)
    })

    if (semanticLegend.null_count > 0 && config.visibility.showUnclassified) {
        const nullPointStyle = config.pointStyle || {
            size: DEFAULT_POINT_SIZE,
            strokeWidth: DEFAULT_POINT_STROKE_WIDTH,
            shape: 'circle',
        }

        resolvedItems.push(withResolvedItemStyle({
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
        }, config, null))
    }

    return resolvedItems
}

function buildResolvedNumericLegendItems(config, semanticLegend) {
    const ranges = Array.isArray(semanticLegend.ranges) ? semanticLegend.ranges : []
    const autoPaletteMap = buildAutomaticPaletteMap(
        ranges.map((range, index) => range.label || `${range.min_value}-${range.max_value}-${index}`),
        config.palette.name,
    )

    const items = ranges.reduce((accumulator, range, index) => {
        const rangeKey = String(range.key || range.label || `${range.min_value}-${range.max_value}-${index}`)
        const configItem = config.palette.items[rangeKey]
        const colors = resolveLegendItemColor({
            configItem,
            legendClass: { key: rangeKey },
            autoPaletteMap,
            config,
        })
        const pointStyle = resolveLegendItemPointStyle(config, configItem)

        accumulator.push(withResolvedItemStyle({
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
            minValue: Number(configItem?.minValue ?? range.min_value),
            maxValue: Number(configItem?.maxValue ?? range.max_value),
            includeMax: index === ranges.length - 1,
        }, config, configItem))

        return accumulator
    }, [])

    if (semanticLegend.null_count > 0 && config.visibility.showUnclassified) {
        items.push(withResolvedItemStyle({
            key: NULL_CLASS_KEY,
            expressionKey: NULL_CLASS_KEY,
            label: 'Sin clasificación',
            count: semanticLegend.null_count,
            fill: config.palette.nullColor || config.palette.fallbackColor,
            stroke: deriveStrokeColor(config.palette.nullColor || config.palette.fallbackColor),
            source: 'null',
            pointSize: config.pointStyle?.size || DEFAULT_POINT_SIZE,
            pointStrokeWidth: config.pointStyle?.strokeWidth ?? DEFAULT_POINT_STROKE_WIDTH,
            pointShape: config.pointStyle?.shape || 'circle',
        }, config, null))
    }

    return items
}

function resolveLegendItemStyle(config, configItem) {
    const globalStyle = config.style || {}
    const itemStyle = configItem?.style || {}
    const borderEnabled = itemStyle.borderEnabled ?? (globalStyle.borderEnabled !== false)
    const dashStyle = itemStyle.dashStyle || globalStyle.dashStyle || 'solid'

    return {
        fillOpacity: itemStyle.fillOpacity ?? globalStyle.fillOpacity ?? 0.6,
        borderEnabled,
        strokeWidth: borderEnabled ? (itemStyle.strokeWidth ?? globalStyle.strokeWidth ?? 2) : 0,
        strokeOpacity: borderEnabled ? (itemStyle.strokeOpacity ?? globalStyle.strokeOpacity ?? 0.8) : 0,
        lineWidth: itemStyle.lineWidth ?? globalStyle.lineWidth ?? 2.5,
        lineOpacity: itemStyle.lineOpacity ?? globalStyle.lineOpacity ?? 0.85,
        dashStyle,
        lineDashArray: dashArrayFor(dashStyle),
    }
}

function withResolvedItemStyle(item, config, configItem) {
    const style = resolveLegendItemStyle(config, configItem)
    return {
        ...item,
        ...style,
        pointStrokeWidth: style.borderEnabled ? item.pointStrokeWidth : 0,
        pointStrokeOpacity: style.strokeOpacity,
    }
}

function dashArrayFor(style) {
    if (style === 'dashed') return [3, 2]
    if (style === 'dotted') return [1, 2]
    return [1, 0]
}

function applyConfiguredStyle(styleExpressions, config) {
    return {
        ...styleExpressions,
        polygonFillOpacityExpression: config.style?.fillOpacity ?? 0.6,
        polygonBorderEnabled: config.style?.borderEnabled !== false,
        polygonStrokeWidthExpression: config.style?.strokeWidth ?? 2,
        polygonStrokeOpacityExpression: config.style?.strokeOpacity ?? 0.8,
        lineWidthExpression: config.style?.lineWidth ?? 2.5,
        lineOpacityExpression: config.style?.lineOpacity ?? 0.85,
        lineDashArray: dashArrayFor(config.style?.dashStyle),
        pointDashStyle: config.style?.dashStyle || 'solid',
        circleOpacityExpression: config.style?.fillOpacity ?? 1,
        pointStrokeOpacityExpression: config.style?.strokeOpacity ?? 1,
        iconOpacityExpression: config.style?.fillOpacity ?? 1,
    }
}

function buildSimpleRenderState(layer, config, defaultPaint) {
    const fill = config.palette.fallbackColor || defaultPaint.defaultFillColor
    const stroke = config.palette.items.__SIMPLE__?.stroke || deriveStrokeColor(fill)
    const pointStyle = config.pointStyle || {}
    const item = {
        key: '__SIMPLE__',
        expressionKey: '__SIMPLE__',
        label: config.palette.items.__SIMPLE__?.label || config.legendTitle || layer.name || 'Capa',
        count: null,
        fill,
        stroke,
        pointSize: pointStyle.size || DEFAULT_POINT_SIZE,
        pointStrokeWidth: pointStyle.strokeWidth ?? DEFAULT_POINT_STROKE_WIDTH,
        pointShape: pointStyle.shape || 'circle',
        dashStyle: config.style?.dashStyle || 'solid',
    }

    return {
        styleExpressions: applyConfiguredStyle({
            ...defaultPaint,
            fillColorExpression: fill,
            strokeColorExpression: stroke,
            pointRadiusExpression: item.pointSize,
            pointStrokeWidthExpression: item.pointStrokeWidth,
            pointShapeExpression: item.pointShape,
            useSymbolForPointShape: item.pointShape !== 'circle' || item.dashStyle !== 'solid',
            legendItems: [item],
            legendAttribute: null,
        }, config),
        legend: {
            title: config.legendTitle || layer.name,
            description: config.description || '',
            attribute: null,
            legendType: 'simple',
            geometryType: config.geometryType,
            dashStyle: config.style?.dashStyle || 'solid',
            items: [item],
            visible: config.visibility.showInMapLegend !== false,
        },
        sourceLayerHint: config.layerName || null,
    }
}

function buildResolvedTextLegendItems(layer, config, semanticLegend, defaultPaint) {
    const configItem = config.palette.items[TEXT_CLASS_KEY] || config.palette.items[LEGACY_TEXT_CLASS_KEY]
    const pointStyle = resolveLegendItemPointStyle(config, configItem)
    const fillColor = configItem?.fill || config.palette.fallbackColor || defaultPaint.defaultFillColor
    const strokeColor = configItem?.stroke || deriveStrokeColor(fillColor)
    const layerName = layer.name || semanticLegend.layer_name || config.layerName || 'Capa'
    const geometryLabel = semanticLegend.geometry_type === 'MultiLineString' || semanticLegend.geometry_type === 'LineString'
        ? 'Líneas'
        : (semanticLegend.geometry_type === 'Point' || semanticLegend.geometry_type === 'MultiPoint' ? 'Puntos' : 'Polígonos')

    return [
        withResolvedItemStyle({
            key: TEXT_CLASS_KEY,
            expressionKey: TEXT_CLASS_KEY,
            label: configItem?.label || `${geometryLabel} — ${layerName}`,
            count: semanticLegend.sample_size || null,
            fill: fillColor,
            stroke: strokeColor,
            source: 'text-fallback',
            pointSize: pointStyle.size,
            pointStrokeWidth: pointStyle.strokeWidth,
            pointShape: pointStyle.shape,
        }, config, configItem),
    ]
}

function buildItemStyleExpression({ attribute, fallback, isNumeric, isText, items, key, transform = value => value }) {
    if (isText) return transform(items[0][key])
    const expressionItems = items.map(item => ({ ...item, [key]: transform(item[key]) }))
    return isNumeric
        ? createNumericRangeExpression(attribute, expressionItems, key, transform(fallback))
        : createAttributeMatchExpression(attribute, expressionItems, key, transform(fallback))
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
    const resolvedSemanticLegend = semanticLegend || buildSemanticLegendFromConfig(config)
    const legendType = String(resolvedSemanticLegend?.legend_type || '').toLowerCase()

    if (!config) {
        return {
            styleExpressions: defaultPaint,
            legend: null,
        }
    }

    if (config.mode === 'manual') {
        return buildSimpleRenderState(layer, config, defaultPaint)
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
        ? buildResolvedNumericLegendItems(config, resolvedSemanticLegend)
        : (isTextLegend
            ? buildResolvedTextLegendItems(layer, config, resolvedSemanticLegend, defaultPaint)
            : buildResolvedLegendItems(config, resolvedSemanticLegend))

    if (items.length === 0) {
        return {
            styleExpressions: defaultPaint,
            legend: null,
        }
    }

    const hasCustomPointShape = items.some(item => (
        item.pointShape && item.pointShape !== 'circle'
    ) || item.dashStyle !== 'solid')
    const configuredStyle = applyConfiguredStyle(defaultPaint, config)
    const showUnclassified = config.visibility?.showUnclassified !== false
    const transparent = 'rgba(0, 0, 0, 0)'
    const unclassifiedFill = showUnclassified
        ? (config.palette.nullColor || config.palette.fallbackColor || defaultPaint.defaultFillColor)
        : transparent
    const unclassifiedStroke = showUnclassified ? deriveStrokeColor(unclassifiedFill) : transparent
    const visibleFallback = value => (showUnclassified ? value : 0)
    const pointStyle = config.pointStyle || {}
    const itemExpression = (key, fallback, transform) => buildItemStyleExpression({
        attribute: config.attribute,
        fallback,
        isNumeric: isNumericLegend,
        isText: isTextLegend,
        items,
        key,
        transform,
    })

    return {
        styleExpressions: {
            ...defaultPaint,
            fillColorExpression: itemExpression('fill', unclassifiedFill),
            strokeColorExpression: itemExpression('stroke', unclassifiedStroke),
            polygonFillOpacityExpression: itemExpression('fillOpacity', visibleFallback(configuredStyle.polygonFillOpacityExpression)),
            polygonBorderEnabled: items.some(item => item.borderEnabled),
            polygonStrokeWidthExpression: itemExpression('strokeWidth', visibleFallback(configuredStyle.polygonStrokeWidthExpression)),
            polygonStrokeOpacityExpression: itemExpression('strokeOpacity', visibleFallback(configuredStyle.polygonStrokeOpacityExpression)),
            lineWidthExpression: itemExpression('lineWidth', visibleFallback(configuredStyle.lineWidthExpression)),
            lineOpacityExpression: itemExpression('lineOpacity', visibleFallback(configuredStyle.lineOpacityExpression)),
            lineDashArray: itemExpression('lineDashArray', configuredStyle.lineDashArray, value => ['literal', value]),
            pointRadiusExpression: itemExpression('pointSize', visibleFallback(pointStyle.size ?? defaultPaint.pointRadiusExpression)),
            pointStrokeWidthExpression: itemExpression('pointStrokeWidth', visibleFallback(pointStyle.strokeWidth ?? defaultPaint.pointStrokeWidthExpression)),
            pointShapeExpression: itemExpression('pointShape', pointStyle.shape || defaultPaint.pointShapeExpression),
            pointDashStyle: config.style?.dashStyle || 'solid',
            circleOpacityExpression: itemExpression('fillOpacity', visibleFallback(configuredStyle.circleOpacityExpression)),
            pointStrokeOpacityExpression: itemExpression('pointStrokeOpacity', visibleFallback(configuredStyle.pointStrokeOpacityExpression)),
            iconOpacityExpression: itemExpression('fillOpacity', visibleFallback(configuredStyle.iconOpacityExpression)),
            useSymbolForPointShape: hasCustomPointShape,
            legendItems: items,
            legendAttribute: config.attribute,
        },
        legend: {
            title: config.legendTitle || layer.name,
            description: config.description || '',
            attribute: resolvedSemanticLegend.attribute || config.attribute,
            legendType,
            geometryType: resolvedSemanticLegend.geometry_type,
            dashStyle: config.style?.dashStyle || 'solid',
            items,
            nullCount: resolvedSemanticLegend.null_count,
            sampleSize: resolvedSemanticLegend.sample_size,
            visible: config.visibility.showInMapLegend !== false,
        },
        sourceLayerHint: resolvedSemanticLegend.layer_name || config.layerName || null,
    }
}
