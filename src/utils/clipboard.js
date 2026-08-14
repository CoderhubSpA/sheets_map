import { stringifyVectorTileLegendConfig } from './vectorTileLegend/editor.js'

export const COPY_SUCCESS_MESSAGE = 'JSON copiado'
export const COPY_ERROR_MESSAGE = 'No fue posible copiar automáticamente. Selecciona el JSON y cópialo manualmente.'
export const CLIPBOARD_WRITE_TIMEOUT_MS = 1200

export async function copyText(
    text,
    navigatorObject = typeof navigator === 'undefined' ? null : navigator,
    _documentObject = typeof document === 'undefined' ? null : document,
    timeoutMs = CLIPBOARD_WRITE_TIMEOUT_MS,
) {
    let timeoutId = null
    try {
        if (!navigatorObject?.clipboard?.writeText) throw new Error('CLIPBOARD_UNAVAILABLE')
        // El catch adjunto consume rechazos tardíos si el timeout gana el race.
        const writePromise = Promise.resolve(navigatorObject.clipboard.writeText(text))
            .then(() => true, () => false)
        const timeoutPromise = new Promise(resolve => {
            timeoutId = setTimeout(() => resolve(false), Math.max(0, timeoutMs))
        })
        const copied = await Promise.race([writePromise, timeoutPromise])
        return copied
    } catch (_error) {
        return false
    } finally {
        if (timeoutId !== null) clearTimeout(timeoutId)
    }
}

export async function copySerializedLegendConfig(draft, writer = copyText) {
    const json = stringifyVectorTileLegendConfig(draft)
    try {
        const copied = await writer(json)
        const success = copied !== false
        return {
            success,
            json,
            message: success ? COPY_SUCCESS_MESSAGE : COPY_ERROR_MESSAGE,
        }
    } catch (_error) {
        return { success: false, json, message: COPY_ERROR_MESSAGE }
    }
}
