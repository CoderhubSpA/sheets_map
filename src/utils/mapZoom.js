export const DEFAULT_MAP_MIN_ZOOM = 0
export const DEFAULT_MAP_MAX_ZOOM = 20

export function normalizeMapZoomLimit(value) {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 0) return undefined

    return parsed
}

export function resolveMapZoomBounds({
    currentMinZoom,
    currentMaxZoom,
    minZoom,
    maxZoom,
} = {}) {
    const requestedMinZoom = normalizeMapZoomLimit(minZoom)
    const requestedMaxZoom = normalizeMapZoomLimit(maxZoom)
    const resolvedMinZoom = requestedMinZoom
        ?? normalizeMapZoomLimit(currentMinZoom)
        ?? DEFAULT_MAP_MIN_ZOOM
    const resolvedMaxZoom = requestedMaxZoom
        ?? normalizeMapZoomLimit(currentMaxZoom)
        ?? DEFAULT_MAP_MAX_ZOOM

    if (resolvedMinZoom > resolvedMaxZoom) return null

    return {
        minZoom: resolvedMinZoom,
        maxZoom: resolvedMaxZoom,
        shouldSetMinZoom: requestedMinZoom !== undefined,
        shouldSetMaxZoom: requestedMaxZoom !== undefined,
    }
}

export function clampMapZoomLevel(level, minZoom, maxZoom) {
    return Math.max(minZoom, Math.min(maxZoom, level))
}
