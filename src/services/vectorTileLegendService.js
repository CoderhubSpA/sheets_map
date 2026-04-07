import axios from 'axios'

function buildUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null

    try {
        return new URL(rawUrl, window.location.origin)
    } catch (error) {
        console.warn('VectorTileLegend: No fue posible construir URL para la leyenda', error)
        return null
    }
}

export function buildVectorTileLegendUrl(tileUrl, layerName, attribute) {
    if (!tileUrl || !layerName) return null

    const url = buildUrl(tileUrl)
    if (!url) return null

    const legendPath = url.pathname.replace(/\/vector\/tiles\/[^/]+(?:\/[^/]+\/[^/]+\/[^/]+)?$/, `/vector/layers/${encodeURIComponent(layerName)}/legend`)

    if (legendPath === url.pathname) {
        return null
    }

    url.pathname = legendPath

    if (attribute) {
        url.searchParams.set('attribute', attribute)
    }

    if (tileUrl.startsWith('/')) {
        return `${url.pathname}${url.search}`
    }

    return url.toString()
}

export async function fetchVectorTileSemanticLegend({ tileUrl, layerName, attribute }) {
    const legendUrl = buildVectorTileLegendUrl(tileUrl, layerName, attribute)

    if (!legendUrl) {
        return null
    }

    const response = await axios.get(legendUrl)
    return response?.data || null
}