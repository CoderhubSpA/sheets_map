import { mergeRequestHeaders } from '../requestAuth.mjs'

export const DRAWN_SELECTION_ATTRIBUTE = '__sheets_selected'
export const SELECTION_KEY_ATTRIBUTE = '__sheets_selection_key'
export const UNSELECTED_OPACITY_FACTOR = 0.5
export const UNSELECTED_COLOR = '#9E9E9E'

// A legacy/missing annotation must not falsely classify a record as rejected.
function rejectedRecord(featureState) {
    return ['==', [featureState ? 'feature-state' : 'get', DRAWN_SELECTION_ATTRIBUTE], featureState ? 'rejected' : false]
}

/** Preserve palette expressions; soften the opacity of rejected records so they stay visible as context. */
export function drawnSelectionOpacity(expression, opacity, selected, featureState = false) {
    const base = typeof expression === 'number' ? expression * opacity : ['*', expression, opacity]
    if (!selected) return base
    return ['*', base, ['case', rejectedRecord(featureState), UNSELECTED_OPACITY_FACTOR, 1]]
}

/** Paint rejected records gray; selected and unannotated records keep their palette color. */
export function drawnSelectionColor(expression, selected, featureState = false) {
    if (!selected) return expression
    return ['case', rejectedRecord(featureState), UNSELECTED_COLOR, expression]
}

export function featureKeyTileUrl(url) {
    if (!url || !/\/vector\/tiles\/[^/]+\//.test(url)) return url
    if (/[?&]feature_keys=/.test(url)) return url.replace(/([?&])feature_keys=[^&#]*/, '$1feature_keys=true')
    const [base, hash] = url.split('#')
    return `${base}${base.includes('?') ? '&' : '?'}feature_keys=true${hash ? '#' + hash : ''}`
}

export function selectedFeatureKeys(value) {
    return Array.isArray(value) && value.length <= 10000 && value.every(key => typeof key === 'string' && /^g1:[a-f0-9]{64}$/.test(key))
        ? new Set(value) : null
}

export function selectionViewport(map, padding = 1) {
    if (!map?.getBounds) return null
    const bounds = map.getBounds().pad(padding)
    let west = bounds.getWest(), east = bounds.getEast()
    const south = Math.max(-89.999, bounds.getSouth()), north = Math.min(89.999, bounds.getNorth())
    if (![west, south, east, north].every(Number.isFinite) || south >= north) return null
    if (west < -180 || east > 180 || west >= east) { west = -180; east = 180 }
    return [west, south, east, north]
}

export function viewportContains(outer, inner) {
    return Boolean(outer && inner && outer[0] <= inner[0] && outer[1] <= inner[1] && outer[2] >= inner[2] && outer[3] >= inner[3])
}

/** Send polygon masks in the existing tile request, never in URLs or per-ID RPCs. */
export function drawnSelectionTileRequest(request, resourceType, tileUrl, areas, baseUrl = globalThis.location?.href) {
    if (resourceType !== 'Tile' || !areas?.length) return request
    try {
        const target = new URL(request.url, baseUrl)
        const source = new URL(tileUrl, baseUrl)
        const root = source.pathname.match(/^(.*\/vector\/tiles\/[^/]+)/)?.[1]
        if (!root || target.origin !== source.origin || !target.pathname.startsWith(root + '/')) return request
    } catch {
        return request
    }
    return { ...request, method: 'POST', body: JSON.stringify({ areas }), cache: 'no-store',
        headers: mergeRequestHeaders(request.headers, { 'Content-Type': 'application/json' }) }
}

export function withoutSelectionMetadata(properties = {}) {
    const result = { ...properties }
    delete result[DRAWN_SELECTION_ATTRIBUTE]
    delete result[SELECTION_KEY_ATTRIBUTE]
    return result
}
