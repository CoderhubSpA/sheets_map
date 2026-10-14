import axios from 'axios'
import { requestWithAuth } from '../utils/requestAuth.mjs'

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

export async function fetchVectorTileSemanticLegend({ tileUrl, layerName, attribute, requestAuth, signal }) {
    const legendUrl = buildVectorTileLegendUrl(tileUrl, layerName, attribute)

    if (!legendUrl) {
        return null
    }

    const response = await requestWithAuth({
        url: legendUrl,
        requestAuth,
        requireBearer: Boolean(requestAuth),
        request: headers => axios.get(legendUrl, { headers, signal }),
    })
    return response?.data || null
}

export async function fetchVectorTileLegendCounts({ tileUrl, layerName, areas, groups, requestAuth, signal }) {
    const legendUrl = buildVectorTileLegendUrl(tileUrl, layerName)
    if (!legendUrl) throw new Error('Unsupported layer count URL')
    const url = buildUrl(legendUrl)
    url.pathname = url.pathname.replace(/\/legend$/, '/counts')
    const countUrl = tileUrl.startsWith('/') ? `${url.pathname}${url.search}` : url.toString()
    const response = await requestWithAuth({
        url: countUrl,
        requestAuth,
        requireBearer: Boolean(requestAuth),
        request: headers => axios.post(countUrl, { areas, groups }, { headers, signal }),
    })
    return response?.data
}
