# PRD — AGCID01-175: Funcionalidades específicas del visor (REQ-704 / REQ-706)

## Contexto

Historia Jira: [AGCID01-175](https://coderhub.atlassian.net/browse/AGCID01-175)
Proyecto: AGCID01 - Infraestructura de datos Espaciales (IDE)
Stack visor: Vue.js + Leaflet 1.8.0 + MapLibre GL 5.8.0 (`SheetsMap.vue`)

Se requiere implementar interacción avanzada con capas del visor, más allá de la visualización básica: transparencia, selección de features, búsqueda por atributo, exportación y cambio de proyección.

Estado actual del código (grounding, ver referencias por punto):

| Feature | Existe hoy | Dónde |
|---|---|---|
| Opacidad por capa (slider) | No | — |
| Click en feature → popup con atributos | Sí (popup Leaflet, no modal) | `PopUpMarker.vue`, `VectorTileLayer.vue:503-554` |
| Búsqueda por atributo | No (solo búsqueda de ubicación) | `SearchBar.vue` (solo direcciones/comunas) |
| Exportación de selección | No (solo descarga de capa completa) | `SheetsMapTools.vue:630` (`download_layer`) |
| Cambio de proyección | Parcial (solo WGS84 ↔ UTM, toggle formato coordenadas) | `SheetsMap.vue:3430-3474` |

---

## REQ-704

### 704.1 — Control de transparencia por capa

**Objetivo:** permitir al usuario ajustar visualmente cuánto se ve una capa sobre el mapa base u otras capas, sin tener que ocultarla.

**Requerimiento:**
- Agregar un slider de opacidad (0–100%) junto a cada capa en el panel de control existente (`SheetsMapTools.vue` / `QuickLayers.vue`).
- El slider debe afectar la capa en tiempo real (sin recarga).
- Debe aplicar tanto a capas GeoJSON (Leaflet) como a capas vectoriales (MapLibre `.pbf`), dado el enfoque híbrido del visor.
- El valor de opacidad debe persistir mientras la sesión del visor esté activa (no requiere persistencia en backend salvo que se indique lo contrario).

**Fuera de alcance:** persistencia de preferencia de opacidad entre sesiones/usuarios (a validar con negocio si se requiere).

**Criterios de aceptación:**
- Dado un layer visible, cuando muevo el slider a 50%, la capa se renderiza a 50% de opacidad sin afectar otras capas.
- Slider en 0% equivale visualmente a capa oculta, pero no cambia el checkbox de visibilidad (son controles independientes).
- Funciona igual en capas GeoJSON y vectoriales.

---

### 704.2 — Selección de feature al click en el mapa

**Objetivo:** al hacer click sobre un elemento de una capa, mostrar su información en un modal.

**Nota de grounding:** el visor **ya tiene** un flujo de click → popup (`PopUpMarker.vue`, disparado desde `VectorTileLayer.vue:tryHandleClick()` vía evento `feature-click`), que muestra atributos configurados en `visible_columns` y soporta edición si `format === "FORM"`. Este PRD asume que el requerimiento es **migrar/complementar ese popup a un modal** (patrón modal ya existente en Sheets, a reutilizar) y agregar el highlight visual del feature seleccionado, no reconstruir el flujo de click desde cero.

**Requerimiento:**
- Al click en un feature (GeoJSON o vector tile), aplicar highlight visual (borde/color distintivo) al elemento seleccionado.
- Mostrar sus atributos en modal (reutilizando componente modal existente en Sheets), en vez de o además del popup actual — a definir con diseño si conviven ambos o el modal reemplaza al popup.
- Al seleccionar un nuevo feature, el highlight anterior se limpia.
- Cerrar el modal limpia el highlight.

**Criterios de aceptación:**
- Click en feature de capa GeoJSON → modal con sus atributos + highlight visual.
- Click en feature de capa vectorial (MapLibre) → mismo comportamiento.
- Click en área vacía del mapa → no abre modal, limpia selección/highlight previo.

---

## REQ-706

### 706.1 — Búsqueda de geometrías por atributo

**Objetivo:** filtrar capas por valores de propiedades específicas (ej. altitud: 789).

**Nota de grounding:** `SearchBar.vue` existe pero solo busca por ubicación (direcciones, comunas, zonas), no por atributos de features. Este es un requerimiento nuevo, no una extensión trivial del buscador actual.

**Requerimiento:**
- Interfaz de búsqueda/filtro que permita al usuario elegir un atributo de la capa activa (ej. altitud, nombre, tipo) y un valor o rango, y filtrar las geometrías visibles en el mapa según ese criterio.
- Debe operar sobre la(s) capa(s) activa(s) en el visor.
- Resultado: el mapa muestra solo (o resalta) las geometrías que cumplen el filtro.

**Preguntas abiertas (a resolver con negocio/diseño antes de estimar):**
- ¿Filtro es exacto (altitud = 789) o por rango (altitud entre X e Y)?
- ¿Aplica sobre una capa a la vez o múltiples capas simultáneamente?
- ¿Los atributos filtrables son fijos por capa o configurables dinámicamente?

**Criterios de aceptación (sujeto a definición):**
- Dado un atributo numérico existente en la capa activa, al ingresar un valor, el mapa muestra solo las geometrías que matchean.
- Limpiar el filtro restaura la vista completa de la capa.

---

### 706.2 — Extracción/exportación de geometrías seleccionadas

**Estado: cerrado, no se implementa** (decisión del usuario, 2026-07-02).

**Objetivo:** exportar exclusivamente las geometrías seleccionadas por el usuario, no la capa completa.

**Nota de grounding:** hoy solo existe descarga de capa completa (`SheetsMapTools.vue:download_layer()`). No existe mecanismo de selección múltiple de features ni exportación parcial.

---

### 706.3 — Cambio de proyección para visualización

**Estado: ✅ implementado** (2026-07-02).

**Nota de grounding:** el visor ya manejaba WGS84 y conversión a UTM (`convertToUTM()`, `SheetsMap.vue:3363-3405`) para mostrar coordenadas en un toggle de formato, pero era *display* de coordenadas del cursor/punto, no un cambio de proyección de la visualización completa del mapa (reproyección de tiles/capas).

**Decisión de alcance (confirmada con el usuario):** se extiende el toggle de coordenadas existente — **no** se reproyecta el render del mapa (tiles/capas siguen en Web Mercator EPSG:3857 vía Leaflet/MapLibre). Descarta el trabajo de reproyección completa (proj4leaflet, incompatibilidad de basemaps externos con otro CRS, etc.).

**Sistemas soportados en el toggle** (`SheetsMap.vue`, botón `.btn-coordinate-format`, cicla con cada click):
- EPSG:4326 — WGS84 lat/lng (formato `"latlng"`, ya existente).
- EPSG:32718 / EPSG:32719 — UTM huso 18S/19S, auto-detectado según longitud (formato `"UTM"`, `convertToUTM()`, ya existente).
- EPSG:3857 — Web Mercator / Pseudo-Mercator (formato `"3857"`, `convertToWebMercator()`, nuevo).
- EPSG:9153 — SIRGAS-Chile 2016, geográfico GRS80 (formato `"9153"`, `convertToSIRGAS()`, nuevo).

**Implementación:** cada formato usa `proj4` para convertir desde WGS84 (`this.center`); `changeCoordinateFormat()` cicla un array de 4 estados en vez del toggle binario anterior. Verificado en navegador que cada estado del ciclo produce coordenadas correctas para el centro del mapa.

---

## Resumen de esfuerzo relativo (cualitativo)

| Req | Complejidad | Motivo | Estado |
|---|---|---|---|
| 704.1 Transparencia | Baja-Media | UI simple, pero debe cubrir 2 motores de render (Leaflet + MapLibre) | ✅ Implementado |
| 704.2 Click→Modal | Media | Flujo de click ya existe; trabajo es reutilizar modal + highlight | ✅ Implementado |
| 706.1 Búsqueda atributo | Media-Alta | No existe base; requiere definir alcance de filtro | ✅ Implementado |
| 706.2 Exportación selección | Alta | Requiere mecanismo de selección múltiple nuevo + exportación | ❌ Cerrado, no se implementa |
| 706.3 Cambio proyección | Baja (alcance acotado a extender el toggle) | Lista de EPSG confirmada por negocio: 4326, 32718/32719, 3857, 9153 | ✅ Implementado |

## Siguientes pasos

Todos los requerimientos de este PRD están cerrados (implementados o descartados). Sin pendientes.
