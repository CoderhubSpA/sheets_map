import { TEXT_CLASS_KEYS } from './constants.js'

function imageId(item, fallbackFill, fallbackStroke, fallbackDashStyle = 'solid') {
    const fill = (item?.fill || fallbackFill || '#3388ff').replace('#', '')
    const stroke = (item?.stroke || fallbackStroke || fill).replace('#', '')
    const parsedWidth = Number(item?.pointStrokeWidth)
    const width = Number.isFinite(parsedWidth) ? Math.max(0, Math.round(parsedWidth)) : 3
    const dashStyle = ['solid', 'dashed', 'dotted'].includes(item?.dashStyle)
        ? item.dashStyle
        : fallbackDashStyle
    return `vtl-shape-${item?.pointShape || 'circle'}-${fill}-${stroke}-${width}-${dashStyle}`
}

function numericCondition(attribute, item) {
    const value = ['to-number', ['get', attribute]]
    const min = Number(item.minValue)
    const max = Number(item.maxValue)
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null
    return item.includeMax
        ? ['all', ['>=', value, min], ['<=', value, max]]
        : ['all', ['>=', value, min], ['<', value, max]]
}

export function parsePointShapeImageId(imageId) {
    if (typeof imageId !== 'string' || !imageId.startsWith('vtl-shape-')) return null
    const [shape, fillPart, strokePart, widthPart, dashPart] = imageId.substring('vtl-shape-'.length).split('-')
    const parsedStrokeWidth = widthPart === undefined || widthPart === '' ? NaN : Number(widthPart)
    return {
        shape: shape || 'circle',
        fill: `#${fillPart || '3388ff'}`,
        stroke: `#${strokePart || fillPart || '3388ff'}`,
        strokeWidth: Number.isFinite(parsedStrokeWidth) ? parsedStrokeWidth : 3,
        dashStyle: ['solid', 'dashed', 'dotted'].includes(dashPart) ? dashPart : 'solid',
    }
}

export function buildPointShapeIconExpression(attribute, items, fallbackFill, fallbackStroke, fallbackDashStyle = 'solid') {
    const safeItems = Array.isArray(items) ? items : []
    const fallback = imageId(null, fallbackFill, fallbackStroke, fallbackDashStyle)
    if (safeItems.length === 0) return fallback

    if (!attribute || safeItems.length === 1 && TEXT_CLASS_KEYS.has(safeItems[0].key)) {
        return imageId(safeItems[0], fallbackFill, fallbackStroke, fallbackDashStyle)
    }

    const numericItems = safeItems.filter(item => Number.isFinite(Number(item.minValue)) && Number.isFinite(Number(item.maxValue)))
    if (numericItems.length > 0) {
        const expression = ['case']
        numericItems.forEach(item => {
            const condition = numericCondition(attribute, item)
            if (!condition) return
            expression.push(condition, imageId(item, fallbackFill, fallbackStroke, fallbackDashStyle))
        })
        safeItems.filter(item => item.key === '__VECTOR_TILE_NULL__').forEach(item => {
            expression.push(
                ['==', ['coalesce', ['get', attribute], '__VECTOR_TILE_NULL__'], '__VECTOR_TILE_NULL__'],
                imageId(item, fallbackFill, fallbackStroke, fallbackDashStyle),
            )
        })
        expression.push(fallback)
        return expression
    }

    const expression = ['match', ['to-string', ['coalesce', ['get', attribute], '__VECTOR_TILE_NULL__']]]
    safeItems.forEach(item => expression.push(item.expressionKey, imageId(item, fallbackFill, fallbackStroke, fallbackDashStyle)))
    expression.push(fallback)
    return expression
}
