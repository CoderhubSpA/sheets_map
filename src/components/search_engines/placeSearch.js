import { NOMINATIM_ERROR_KIND, nominatimClient, parseCoordinates } from './nominatimClient.js'

// Coordina las búsquedas de SearchBarNominatim: solo la búsqueda vigente puede actualizar la
// interfaz. Borrar o destruir el buscador invalida la que esté en curso, para que una respuesta
// tardía no repueble la lista ni mueva el mapa.
export function createPlaceSearch(client = nominatimClient) {
    let generation = 0

    return {
        invalidate() {
            generation++
        },
        // Devuelve null si la búsqueda dejó de estar vigente mientras se esperaba la respuesta.
        async run(query, config = {}) {
            const id = ++generation
            const coordinates = parseCoordinates(query)
            if (coordinates) return { kind: 'coordinates', coordinates }

            try {
                const places = await client.search(query, config)
                if (id !== generation) return null
                return places.length > 0 ? { kind: 'places', places } : { kind: 'empty' }
            } catch (error) {
                if (id !== generation) return null
                return { kind: error?.kind === NOMINATIM_ERROR_KIND.BUSY ? 'busy' : 'failed', error }
            }
        },
    }
}
