import axios from 'axios'

function buildUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null

    try {
        return new URL(rawUrl, window.location.origin)
    } catch (error) {
        console.warn('VectorTileAttributes: No fue posible construir URL para los atributos', error)
        return null
    }
}

export function buildVectorTileAttributesUrl(tileUrl, layerName) {
    if (!tileUrl || !layerName) return null

    const url = buildUrl(tileUrl)
    if (!url) return null

    const attributesPath = url.pathname.replace(/\/vector\/tiles\/[^/]+(?:\/[^/]+\/[^/]+\/[^/]+)?$/, `/vector/layers/${encodeURIComponent(layerName)}/attributes`)

    if (attributesPath === url.pathname) {
        return null
    }

    url.pathname = attributesPath

    if (tileUrl.startsWith('/')) {
        return `${url.pathname}${url.search}`
    }

    return url.toString()
}

export async function fetchVectorTileAttributes({ tileUrl, layerName }) {
    const attributesUrl = buildVectorTileAttributesUrl(tileUrl, layerName)

    if (!attributesUrl) {
        return null
    }

    const response = await axios.get(attributesUrl)
    return response?.data || null
}
