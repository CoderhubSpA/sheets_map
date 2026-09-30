import axios from 'axios'
import { requestWithAuth } from '../utils/requestAuth.mjs'

const TILE_PATH_PATTERN = /\/vector\/tiles\/[^/]+(?:\/[^/]+\/[^/]+\/[^/]+)?$/

function buildUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null

    try {
        return new URL(rawUrl, window.location.origin)
    } catch (error) {
        console.warn('VectorTileFeature: No fue posible construir URL para la geometría completa', error)
        return null
    }
}

// Deriva la URL de la geometría completa de un feature a partir de la URL de tiles de la capa.
export function buildVectorTileFeatureUrl(tileUrl, layerName, featureId, idProperty = 'id') {
    if (!tileUrl || !layerName || featureId === undefined || featureId === null || featureId === '') return null

    const url = buildUrl(tileUrl)
    if (!url) return null

    const featurePath = url.pathname.replace(
        TILE_PATH_PATTERN,
        `/vector/layers/${encodeURIComponent(layerName)}/features/${encodeURIComponent(String(featureId))}`,
    )

    if (featurePath === url.pathname) {
        return null
    }

    url.pathname = featurePath
    url.search = idProperty && idProperty !== 'id' ? `?idProperty=${encodeURIComponent(idProperty)}` : ''
    url.hash = ''

    if (tileUrl.startsWith('/')) {
        return `${url.pathname}${url.search}`
    }

    return url.toString()
}

// Retorna el FeatureCollection con la geometría completa, o null si no se puede consultar
// (URL no derivable, backend sin el endpoint o feature inexistente).
export async function fetchVectorTileFeature({ tileUrl, layerName, featureId, idProperty, requestAuth, signal }) {
    const featureUrl = buildVectorTileFeatureUrl(tileUrl, layerName, featureId, idProperty)

    if (!featureUrl) {
        return null
    }

    try {
        const response = await requestWithAuth({
            url: featureUrl,
            requestAuth,
            requireBearer: Boolean(requestAuth),
            request: headers => axios.get(featureUrl, { headers, signal }),
        })
        return response?.data || null
    } catch (error) {
        if (error?.response?.status === 404) {
            return null
        }
        throw error
    }
}
