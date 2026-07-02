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

**Objetivo:** exportar exclusivamente las geometrías seleccionadas por el usuario, no la capa completa.

**Nota de grounding:** hoy solo existe descarga de capa completa (`SheetsMapTools.vue:download_layer()`). No existe mecanismo de selección múltiple de features ni exportación parcial.

**Requerimiento:**
- Permitir selección de una o más geometrías en el mapa (mecanismo de selección múltiple — a definir: click+shift, herramienta de selección por área, checkbox en resultados de búsqueda, etc.).
- Botón de exportación que genere un archivo (formato a definir: GeoJSON como mínimo, evaluar shapefile) conteniendo únicamente las geometrías seleccionadas.

**Preguntas abiertas:**
- ¿Mecanismo de selección múltiple (click individual + modificador, selección por polígono/rectángulo, selección desde resultados de 706.1)?
- ¿Formato(s) de exportación requeridos (GeoJSON, Shapefile, KML)?

**Criterios de aceptación (sujeto a definición):**
- Con N features seleccionados, exportar genera un archivo con exactamente esos N features y sus atributos.
- Sin selección, el botón de exportar está deshabilitado o no visible.

---

### 706.3 — Cambio de proyección para visualización

**Estado:** **aún por definir** (según lo indicado explícitamente en el requerimiento original).

**Nota de grounding:** el visor ya maneja WGS84 y conversión a UTM (`convertToUTM()`, `SheetsMap.vue:3430-3472`) para mostrar coordenadas en un toggle de formato, pero esto es solo *display* de coordenadas del cursor/punto, no un cambio de proyección de la visualización completa del mapa (reproyección de tiles/capas).

**Pendiente de definir con negocio:**
- ¿Se requiere reproyectar el mapa completo (tiles + capas) a otro EPSG, o basta con extender el toggle de coordenadas actual a más sistemas?
- Lista de proyecciones objetivo requeridas.

**Acción:** no estimar ni desarrollar hasta recibir definición. Se recomienda levantar como spike/investigación separado.

---

## Resumen de esfuerzo relativo (cualitativo)

| Req | Complejidad | Motivo |
|---|---|---|
| 704.1 Transparencia | Baja-Media | UI simple, pero debe cubrir 2 motores de render (Leaflet + MapLibre) |
| 704.2 Click→Modal | Media | Flujo de click ya existe; trabajo es reutilizar modal + highlight |
| 706.1 Búsqueda atributo | Media-Alta | No existe base; requiere definir alcance de filtro |
| 706.2 Exportación selección | Alta | Requiere mecanismo de selección múltiple nuevo + exportación |
| 706.3 Cambio proyección | Sin definir | Bloqueado por definición de negocio |

## Siguientes pasos

1. Validar con negocio las preguntas abiertas de 706.1, 706.2 y 706.3 antes de pasar a diseño técnico/tasks.
2. Definir con diseño UX si el modal de 704.2 reemplaza o convive con el popup actual.
3. Una vez cerradas definiciones, continuar con spec técnica (`/sdd-spec`) y diseño (`/sdd-design`) por cada REQ.
