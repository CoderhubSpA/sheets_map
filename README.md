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

1. Upgrade `"version"` in `package.json`.

2. Compile:

```
npm run build:lib
```

3. Publish:

```
npm publish
```

4. Update repo: `stage` changes, `commit` and `push`.

\
&nbsp;

## Configuración en Sheets

### Instalar en Sheets

Ejecutar

```bash
npm install @CoderhubSpA/sheets_map@latest
```

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
| `setZoom`                | `setZoom(level)`           | Establecer un nivel de zoom específico (0–20)                      |
| `getZoom`                | `getZoom()`                | Obtener el nivel de zoom actual                                    |
| `flyTo`                  | `flyTo(latLng, zoom?)`     | Volar a `{ lat, lng }` con zoom opcional (default 12)              |
| `teleportTo`             | `teleportTo(latLng, zoom?)` | Centrar el mapa sin animación ni marcador de geolocalización       |
| `panTo`                  | `panTo(latLng)`            | Centrar el mapa en `{ lat, lng }` sin animación                    |
| `filterByBounds`         | `filterByBounds()`         | Filtrar datos por zona visible del mapa                            |
| `toggleCoordinateFormat` | `toggleCoordinateFormat()` | Alternar formato de coordenadas (latlng / UTM)                     |
| `getCenter`              | `getCenter()`              | Obtener coordenadas del centro actual                              |
| `invalidateSize`         | `invalidateSize()`         | Recalcular tamaño del mapa (útil tras redimensionar el contenedor) |
| `getLeafletMap`          | `getLeafletMap()`          | Acceso directo al objeto Leaflet `L.Map` (avanzado)                |
| `removeBaseLayer`        | `removeBaseLayer()`        | Ocultar la capa base (fondo gris neutro)                           |
| `restoreBaseLayer`       | `restoreBaseLayer()`       | Restaurar la capa base                                             |
| `isBaseLayerHidden`      | `isBaseLayerHidden()`      | `true` si la capa base está oculta                                 |

---

### Métodos de dibujo de polígonos

| Método                | Firma                   | Descripción                                                                                              |
| --------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `drawShape`           | `drawShape(shape)`      | Iniciar dibujo: `'polygon'`, `'circle'`, `'rectangle'`. También acepta `'delete'`, `'cancel'`, `'clear'` |
| `cancelDraw`          | `cancelDraw()`          | Cancelar el dibujo en progreso sin eliminar polígonos ya completados                                     |
| `clearPolygons`       | `clearPolygons()`       | Eliminar todos los polígonos dibujados                                                                   |
| `toggleEraserMode`    | `toggleEraserMode()`    | Activar/desactivar el modo borrador (toggle)                                                             |
| `setEraserMode`       | `setEraserMode(active)` | Activar o desactivar el modo borrador de forma idempotente                                               |
| `hasPolygons`         | `hasPolygons()`         | `true` si hay al menos un polígono dibujado                                                              |
| `isEraserActive`      | `isEraserActive()`      | `true` si el modo borrador está activo                                                                   |
| `isDrawingInProgress` | `isDrawingInProgress()` | `true` si hay un dibujo en progreso (sin confirmar)                                                      |
| `onPolygonFilter`     | `onPolygonFilter(cb)`   | Registrar callback que se ejecuta cuando cambian los polígonos. Recibe `bounds_filters` (array\|null)    |

---

### Flujo de dibujo de polígonos

#### 1. Iniciar el modo dibujo

```js
// Activa el cursor crosshair y habilita el dibujo continuo
mapActions.drawShape("polygon"); // o 'circle' / 'rectangle'

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
mapActions.setEraserMode(true); // activar
mapActions.setEraserMode(false); // desactivar

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
mapActions.drawShape("polygon");
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
