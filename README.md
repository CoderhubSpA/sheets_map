# Sheets Map

## Project setup

---

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build:lib
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

\
&nbsp;

## How to publish

---

1. Actualizar `"version"` en `package.json` y documentar la versión en `CHANGELOG.md`.

2. Ejecutar las verificaciones:

```bash
npm test
npm run lint
```

3. Inspeccionar el contenido publicable. `prepack` compila `dist` automáticamente:

```bash
npm pack --dry-run
```

4. Crear y revisar el commit o PR de release.

5. Publicar desde el commit aprobado:

```bash
npm publish
```

Mientras el lockfile permanezca fuera del repositorio, el tarball no es reproducible
byte a byte. La publicación debe ejecutarse desde un entorno aprobado, registrando las
versiones de Node/npm y revisando nuevamente la salida de `npm pack --dry-run`.

\
&nbsp;

## Configuración en Sheets

### Instalar en Sheets

Ejecutar

```bash
npm install coderhubspa_sheets_map@latest
```

### Autenticación de capas restringidas

Entregar el mismo proveedor mediante la prop `request_auth` de `SheetsMap` y
`SheetsMapTools`. La librería solo lo utiliza para capas marcadas con
`sh_map_has_layer_requires_bearer` o con `auth.mode: "runtime-bearer"` en
`mapActions.addLayer`.

```vue
<SheetsMap :request_auth="mapTokenClient" />
<SheetsMapTools :request_auth="mapTokenClient" />
```

El proveedor debe implementar este contrato:

| Método | Responsabilidad |
| --- | --- |
| `getHeaders(url)` | Obtiene o renueva la credencial y retorna una promesa con los headers; puede establecer la confianza inicial del destino. |
| `peekHeaders(url)` | Retorna sincrónicamente los headers vigentes para MapLibre. |
| `isTrustedUrl(url)` | Confirma únicamente orígenes GIS aprobados después de que `getHeaders` inicializa la credencial. |
| `invalidate(token)` | Invalida solo el token rechazado para permitir un reintento tras `401`; la librería consolida la invalidación y renovación concurrente del mismo token. |

Una capa protegida no degrada a transporte anónimo si el proveedor no puede
obtener un Bearer. El modo histórico `ogp-bearer` sigue disponible para
integraciones que usan `window.__OGP_RUNTIME_AUTH__`, pero para destinos externos
ese objeto debe implementar `isTrustedUrl(url)` con una allowlist controlada por
el host. Sin ese callback, el modo legacy solo autoriza URLs del mismo origen de
la página. Las integraciones nuevas deben preferir `request_auth`.

`mapActions.addLayer` rechaza modos de autenticación desconocidos. Si metadata
persistida declara un modo o flag contradictorio, la capa se trata como protegida
y falla cerrada en vez de degradar a transporte anónimo.

MapLibre inyecta únicamente el resultado vigente de `peekHeaders`; si el proveedor
revoca la confianza, elimina cualquier `Authorization` previamente cacheado. Cada
instancia de source permite como máximo una recuperación automática tras `401` para
evitar cadenas ilimitadas de renovación.

---

### Casos soportados por el "Mapa de claves" de Sheets Map :

1 - No mostrar nada

2 - Mostrar todos los nombres formateados para que sea legible por el usuario
Ejemplo:

```Text
*
```

3 - Mostrar solo los nombres definidos por el usuario
Ejemplo:

```JSON
{
    "CUT_REG":"Codigo región",
    "REGION":"Región",
    "SUPERFICIE":"Superficie total",
}
```

3.1 - Mostrar nombres definidos de todas las metricas:
Se usa "metric_data" seguido de un punto "." y un asterisco "\*"

`{
    "metric_data.*":"Metrica"
}`

Ejemplo:

```JSON
{
    "CUT_REG":"Codigo región",
    "REGION":"Región",
    "SUPERFICIE":"Superficie total",
    "metric_data.*":"Metrica"
}
```

3.2 - Mostrar los nombres para cada metrica en concreto:
Se usa "metric_data" seguido de un punto "." y el nombre de columna de la métrica (Ejem. "migraciones").
_Si se agregan varias, solo se mostraría la métrica activa_ y las otras no se verían

Ejemplo:

```JSON

{
    "CUT_REG":"Codigo región",
    "REGION":"Región",
    "SUPERFICIE":"Superficie total",
    "metric_data.nuevas_empresas":"Nuevas empresas",
    "metric_data.migraciones":"Total migraciones"
}
```

Notas:

1. _Respecto a `metric_data`_ :
   Siempre se debe usar `metric_data.` para mostrar el valor de una métrica, ya sea con asterisco o definiendo el nombre de columna.
1. _Uso de `"."`_ : Si una propiedad de una métrica o una metadata es un objeto, se puede mostrar valores de ese objeto utilizando el recurso de puntos. Ejemplo:

   Si mi propiedad del objeto GEOJSON se ve así:

   ```JSON
   {
       "direccion":{
           "calle": "John Doe",
           "numero": "123"
       }
   }
   ```

   Puedo configurar mi mapa de claves de la siguiente manera para obtener la calle:

   ```JSON
   {
       "direccion.calle": "Calle"
   }
   ```

\
&nbsp;

## API de acciones del mapa (`mapActions`)

---

`mapActions` es la API pública del componente `SheetsMap`. Permite controlar el mapa desde un componente padre, sin acceso directo al internals.

### Obtener la referencia

**Opción 1 — por evento (recomendada):**

```vue
<SheetsMap @map-actions-ready="onActionsReady" />
```

```js
methods: {
    onActionsReady(actions) {
        this.mapActions = actions;
    }
}
```

**Opción 2 — por `$refs`:**

```js
this.$refs.sheetsMap.mapActions.zoomIn();
```

---

### Métodos de control del mapa

| Método                   | Firma                      | Descripción                                                        |
| ------------------------ | -------------------------- | ------------------------------------------------------------------ |
| `zoomIn`                 | `zoomIn()`                 | Acercar el zoom en 1 nivel                                         |
| `zoomOut`                | `zoomOut()`                | Alejar el zoom en 1 nivel                                          |
| `setZoom`                | `setZoom({ level, options? })` | Establecer un nivel de zoom dentro de los límites configurados  |
| `getZoom`                | `getZoom()`                | Obtener el nivel de zoom actual                                    |
| `flyTo`                  | `flyTo({ latLng, zoom?, options? })` | Volar a `{ lat, lng }` con zoom opcional (default 12)     |
| `teleportTo`             | `teleportTo({ latLng, zoom?, options? })` | Centrar el mapa sin animación ni marcador         |
| `panTo`                  | `panTo({ latLng, options? })` | Centrar el mapa en `{ lat, lng }` sin animación                 |
| `configureMapZoom`       | `configureMapZoom({ minZoom?, maxZoom?, maxNativeZoom? })` | Configurar límites de navegación y overzoom |
| `filterByBounds`         | `filterByBounds()`         | Filtrar datos por zona visible del mapa                            |
| `toggleCoordinateFormat` | `toggleCoordinateFormat()` | Ciclar formato de coordenadas (WGS84 / UTM / Web Mercator / SIRGAS-Chile 2016) |
| `getCenter`              | `getCenter()`              | Obtener coordenadas del centro actual                              |
| `invalidateSize`         | `invalidateSize()`         | Recalcular tamaño del mapa (útil tras redimensionar el contenedor) |
| `getLeafletMap`          | `getLeafletMap()`          | Acceso directo al objeto Leaflet `L.Map` (avanzado)                |
| `removeBaseLayer`        | `removeBaseLayer()`        | Ocultar la capa base (fondo gris neutro)                           |
| `restoreBaseLayer`       | `restoreBaseLayer()`       | Restaurar la capa base                                             |
| `isBaseLayerHidden`      | `isBaseLayerHidden()`      | `true` si la capa base está oculta                                 |

Las acciones mutadoras públicas, incluyendo `teleportTo`, `addLayer`, `removeLayer`,
`setLayerRenderState`, `setLayerVisibility` y `configureMapZoom`, conservan retornos
síncronos. Un consumidor puede usar `await` sobre esos resultados, pero la librería no
reemplaza el valor retornado por una `Promise`.

Cuando no se configuran límites explícitos, la navegación usa el rango histórico
`0..20`. Los valores vacíos, booleanos y arreglos no se interpretan como zoom `0`.

### Estado y recuperación del runtime

| Método | Firma | Descripción |
| --- | --- | --- |
| `isConfigurationReady` | `isConfigurationReady(): boolean` | Indica si la configuración inicial está disponible. |
| `isRuntimeReady` | `isRuntimeReady(): boolean` | Exige configuración y una instancia de mapa activa. |
| `snapshotRuntimeState` | `snapshotRuntimeState(): object` | Captura una instantánea aislada del estado actual. |
| `restoreRuntimeState` | `restoreRuntimeState(snapshot): Promise<boolean>` | Valida y restaura una instantánea antes de esperar el siguiente render. |
| `getContracts` | `getContracts(): object` | Retorna contratos inmutables de acciones remotas de bootstrap. |

Las instantáneas son valores opacos: deben provenir de `snapshotRuntimeState` y volver a
`restoreRuntimeState` sin modificaciones. Los métodos de lifecycle no forman parte de
`MAP_ACTION_CONTRACTS`, porque no son acciones remotas ejecutables desde un payload OGP.
Las acciones de dibujo `drawShape` y `setEraserMode` tienen contrato de payload, pero no
participan en rutas transaccionales porque el estado interno de Geoman no forma parte de
la instantánea del mapa.
La transacción que agrupa varias acciones pertenece al consumidor; Sheets Map aporta una
captura aislada y una restauración prevalidada. Si una integración externa falla durante
la restauración, el consumidor debe tratar el rollback como no recuperable.

---

### Métodos de dibujo de polígonos

| Método                | Firma                   | Descripción                                                                                              |
| --------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `drawShape`           | `drawShape({ shape })`  | Iniciar dibujo: `'polygon'`, `'circle'`, `'rectangle'`. También acepta `'delete'`, `'cancel'`, `'clear'` |
| `cancelDraw`          | `cancelDraw()`          | Cancelar el dibujo en progreso sin eliminar polígonos ya completados                                     |
| `clearPolygons`       | `clearPolygons()`       | Eliminar todos los polígonos dibujados                                                                   |
| `toggleEraserMode`    | `toggleEraserMode()`    | Activar/desactivar el modo borrador (toggle)                                                             |
| `setEraserMode`       | `setEraserMode({ active })` | Activar o desactivar el modo borrador de forma idempotente                                           |
| `hasPolygons`         | `hasPolygons()`         | `true` si hay al menos un polígono dibujado                                                              |
| `isEraserActive`      | `isEraserActive()`      | `true` si el modo borrador está activo                                                                   |
| `isDrawingInProgress` | `isDrawingInProgress()` | `true` si hay un dibujo en progreso (sin confirmar)                                                      |
| `onPolygonFilter`     | `onPolygonFilter(cb)`   | Registrar callback que se ejecuta cuando cambian los polígonos. Recibe `bounds_filters` (array\|null)    |

---

### Flujo de dibujo de polígonos

#### 1. Iniciar el modo dibujo

```js
// Activa el cursor crosshair y habilita el dibujo continuo
mapActions.drawShape({ shape: "polygon" }); // o 'circle' / 'rectangle'

// Escuchar cambios en los polígonos dibujados
mapActions.onPolygonFilter((bounds_filters) => {
  // bounds_filters: array con filtros cuando hay polígonos, null cuando se limpian
  const hasPolygons = bounds_filters !== null;
});
```

Mientras el modo dibujo está activo, **al completar un polígono el modo se re-habilita automáticamente** — el usuario puede dibujar múltiples polígonos sin necesidad de volver a activar la función.

#### 2. Activar el modo borrador (eraser)

```js
// Toggle — activa si está desactivado, desactiva si está activo
mapActions.toggleEraserMode();

// O de forma idempotente
mapActions.setEraserMode({ active: true }); // activar
mapActions.setEraserMode({ active: false }); // desactivar

// Consultar estado actual
const erasing = mapActions.isEraserActive();
```

Al activar el eraser, el modo dibujo se pausa automáticamente. Al desactivarlo, el modo dibujo se retoma con el mismo shape anterior.

El usuario elimina polígonos individuales haciendo click sobre ellos mientras el eraser está activo.

#### 3. Cerrar / cancelar el modo dibujo

```js
// Cancela el trazo en progreso (sin eliminar polígonos ya completados)
mapActions.cancelDraw();

// Eliminar todos los polígonos y limpiar los filtros
mapActions.clearPolygons();

// Desregistrar el callback de filtros
mapActions.onPolygonFilter(null);
```

#### Ejemplo completo

```js
// Activar
mapActions.drawShape({ shape: "polygon" });
mapActions.onPolygonFilter((bounds_filters) => {
  this.polygonDrawn = bounds_filters !== null;
});

// El usuario dibuja polígonos... puede dibujar varios seguidos.

// Si quiere borrar uno: activar eraser
mapActions.toggleEraserMode();
// El usuario hace click sobre el polígono a eliminar

// Desactivar eraser (retoma el modo dibujo)
mapActions.toggleEraserMode();

// Al cerrar: cancelar dibujo en progreso + limpiar todo
mapActions.cancelDraw();
mapActions.clearPolygons();
mapActions.onPolygonFilter(null);
```

---

### Comportamiento del cursor

| Estado                             | Cursor                    |
| ---------------------------------- | ------------------------- |
| Modo dibujo activo                 | `crosshair`               |
| Polígono completado, modo continuo | `crosshair` (se mantiene) |
| Eraser activado                    | normal                    |
| Dibujo cancelado                   | normal                    |
