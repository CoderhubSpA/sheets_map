# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
versionado según [SemVer](https://semver.org/lang/es/).

## [1.54.0] - 2026-07-02

Implementación de AGCID01-175: funcionalidades específicas del visor.

### Added

- Slider de opacidad por capa, en el popover de configuración de la capa (REQ-704.1).
- Al hacer click en un feature (vector-tile o GeoJSON), se resalta en el mapa y se muestra su
  detalle en un modal propio de la librería (REQ-704.2). Con muchas propiedades, el cuerpo del
  modal scrollea manteniendo el encabezado fijo.
- Filtro de features por atributo para capas vector-tile, en el mismo popover del slider de
  opacidad: selector de atributo (cargado desde el backend) + campo de valor, filtrado server-side
  vía el endpoint de tiles (REQ-706.1).
- El toggle de formato de coordenadas ahora soporta 4 sistemas (antes solo WGS84/UTM): EPSG:4326,
  EPSG:32718/32719 (UTM, huso auto-detectado), EPSG:3857 (Web Mercator) y EPSG:9153
  (SIRGAS-Chile 2016) (REQ-706.3).

### Changed

- El popup nativo de Leaflet/MapLibre al hacer click en un feature fue reemplazado por el modal de
  detalle propio de la librería.
- Popover de configuración de capa: título general "Configuraciones de capa", etiqueta "Nivel de
  transparencia" sobre el slider, y botón "Limpiar filtro" con apariencia de botón sólido.

### Fixed

- CORS entre Sheets Map y Sheets Mock al consultar capas (causado por mixed content HTTPS→HTTP, no
  por configuración CORS del backend).
- El popover de "Configuraciones de capa" (opacidad + filtro por atributo) no aparecía para capas
  dentro de un subgrupo colapsable, solo para capas sueltas.
- Las opciones del selector de atributo (`Filtrar por atributo`) eran ilegibles: texto blanco
  sobre el fondo blanco fijo que el navegador usa para el listado nativo de `<option>`.
