export function normalizePointCanvasStrokeWidth(value) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return 3
    return Math.max(0, Math.min(12, parsed))
}

export function pointCanvasDashPattern(style, scale = 1) {
    if (style === 'dashed') return [8 * scale, 5 * scale]
    if (style === 'dotted') return [1.5 * scale, 4 * scale]
    return []
}
