import { NULL_CLASS_KEY } from './constants.js'

/** Build exact count predicates from the displayed classes without changing their styles. */
export function legendCountGroups(legend) {
    return legend.items.map(item => {
        const filters = []
        const field = legend.attribute
        if (field && !['simple', 'default', 'text'].includes(legend.legendType)) {
            // A null class rebuilt from a persisted palette keeps its reserved key but not source 'null'.
            if (item.source === 'null' || item.key === NULL_CLASS_KEY) {
                filters.push({ field, operator: 'isnull' })
            } else if (['numeric', 'numerical'].includes(legend.legendType)) {
                if (Number.isFinite(item.minValue)) filters.push({ field, operator: 'gte', raw_value: String(item.minValue) })
                if (Number.isFinite(item.maxValue)) filters.push({ field,
                    operator: item.includeMax || !Number.isFinite(item.minValue) ? 'lte' : 'lt',
                    raw_value: String(item.maxValue) })
                if (!filters.length) throw new Error('Missing numeric class bounds')
            } else {
                filters.push({ field, operator: 'eq', raw_value: String(item.expressionKey ?? item.key) })
            }
        } else if (legend.items.length !== 1) {
            throw new Error('Multiple count classes require an attribute')
        }
        return { key: String(item.key), filters }
    })
}

export function pendingLegendCounts(legend, spatialFiltered, countStatus = 'loading') {
    return { ...legend, spatialFiltered, countStatus, totalCount: null,
        items: legend.items.map(item => ({ ...item, count: null })) }
}

export function mergeExactLegendCounts(legend, response, spatialFiltered) {
    const validCount = value => Number.isSafeInteger(value) && value >= 0
    if (!validCount(response?.total_count) || legend.items.some(item =>
        !Object.prototype.hasOwnProperty.call(response?.counts || {}, String(item.key)) ||
        !validCount(response.counts[String(item.key)]))) throw new Error('Invalid count response')
    return { ...legend, spatialFiltered, countStatus: 'ready', totalCount: response.total_count,
        geometryType: response.geometry_type || legend.geometryType,
        items: legend.items.map(item => ({ ...item, count: response.counts[String(item.key)] })) }
}

export function defaultCountLegend(layer) {
    const fill = layer.sh_map_has_layer_text_color || layer.sh_map_has_layer_color || '#3388ff'
    return { title: layer.name, legendType: 'default', visible: true,
        items: [{ key: 'all_features', label: 'Registros', count: null, fill,
            stroke: layer.sh_map_has_layer_color || fill }] }
}
