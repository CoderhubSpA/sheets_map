# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
versionado según [SemVer](https://semver.org/lang/es/).

## [1.57.0] - 2026-08-31

### Added

- Prop pública `request_auth` para autenticar WMS, WFS, descargas, vector tiles, atributos, leyendas
  y vistas previas mediante un proveedor administrado por el consumidor.
- Transporte WMS autenticado con cancelación de solicitudes y liberación de object URLs.

### Fixed

- El Bearer solo se entrega a capas protegidas y a URLs que el proveedor confirma como confiables;
  las demás conservan transporte anónimo aunque compartan el visor.
- Las capas protegidas fallan cerradas cuando no existe una credencial válida, en lugar de degradar
  silenciosamente a solicitudes anónimas.
- Los `401` invalidan el token exacto, coalescen invalidaciones concurrentes y permiten un único
  reintento; MapLibre separa las generaciones con identificadores no sensibles para que respuestas
  tardías no invaliden credenciales nuevas.
- Los proveedores con confianza lazy pueden emitir su credencial antes de la validación final del
  origen; MapLibre elimina headers cacheados después de una revocación y limita la recuperación a
  un intento por instancia de source.
- La vista previa de simbología usa el mismo transporte autenticado que la capa visible.
- Se conserva compatibilidad con capas existentes que declaran `ogp-bearer`, exigiendo confianza
  aprobada por el host para destinos externos.
- La metadata de autenticación inválida o contradictoria falla cerrada y los modos dinámicos
  desconocidos se rechazan al normalizar la capa.
- Las descargas autenticadas conservan el nombre indicado por `Content-Disposition` y usan una
  extensión segura derivada del formato, MIME o URL cuando el servidor no entrega un nombre.
- El paquete publicado contiene únicamente el build de `dist` y ya no distribuye archivos internos
  del repositorio; `prepack` genera el build antes de empaquetar.

## [1.54.1] - 2026-07-02

### Fixed

- Las opciones del selector de atributo (`Filtrar por atributo`) eran ilegibles: texto blanco
  sobre el fondo blanco fijo que el navegador usa para el listado nativo de `<option>`. Este fix
  no alcanzó a entrar en el publish de 1.54.0.

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
