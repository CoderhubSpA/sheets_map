export function buildFilteredVectorTileUrl(tileUrl, attribute, value) {
    if (!tileUrl || !attribute || value === '' || value === null || value === undefined) {
        return tileUrl
    }

    const separator = tileUrl.includes('?') ? '&' : '?'
    return `${tileUrl}${separator}filter.${encodeURIComponent(attribute)}=eq.${encodeURIComponent(value)}`
}

// Pide al geoserver la capa `<capa>_label` (un punto de anclaje por polígono) junto con los tiles.
export function buildLabeledVectorTileUrl(tileUrl, enabled) {
    if (!tileUrl || !enabled) {
        return tileUrl
    }

    const separator = tileUrl.includes('?') ? '&' : '?'
    return `${tileUrl}${separator}labels=true`
}

export function buildVectorTileTemplateUrl(tileUrl = '') {
    if (!tileUrl || /\{z\}.*\{x\}.*\{y\}/.test(tileUrl)) return tileUrl

    const match = String(tileUrl).match(/^([^?#]*)(\?[^#]*)?(#.*)?$/)
    if (!match) return tileUrl
    const base = match[1].replace(/\/$/, '')
    return `${base}/{z}/{x}/{y}.pbf${match[2] || ''}${match[3] || ''}`
}
