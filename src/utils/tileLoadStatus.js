// Seguimiento de la carga de teselas de una capa de Leaflet, vista por vista.

/**
 * Escucha la carga de teselas de `tileLayer` y llama a `onStatus` al empezar a cargar una vista
 * (`{ loading: true, failed: 0, total: 0 }`) y al terminarla (`{ loading: false, failed, total }`).
 * El navegador no expone el estado HTTP de una imagen: un 401, un 500 o una respuesta que no es
 * imagen cuentan igual como tesela fallida. Devuelve una función que quita los listeners.
 */
export function watchTileLoad(tileLayer, onStatus) {
    let loaded = 0;
    let failed = 0;
    const handlers = {
        loading: () => {
            loaded = 0;
            failed = 0;
            onStatus({ loading: true, failed: 0, total: 0 });
        },
        tileload: () => {
            loaded += 1;
        },
        tileerror: () => {
            failed += 1;
        },
        load: () => onStatus({ loading: false, failed, total: loaded + failed }),
    };
    tileLayer.on(handlers);
    return () => tileLayer.off(handlers);
}
