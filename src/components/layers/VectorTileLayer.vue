<template>
    <!-- No renderiza ningun funcionalidad, pero es necesario para evitar que arroje un error por consola
     indicando que hace falta el bloque <template> -->
    <div style="display: none;"></div>
</template>

<script>
import L from 'leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';
import { normalizeVectorTileLegendConfig, inferVectorTileLayerNameFromUrl } from '../../utils/vectorTileLegend/config';
import { buildDefaultVectorTilePaint, buildVectorTileSemanticRenderState } from '../../utils/vectorTileLegend/style';
import { fetchVectorTileSemanticLegend } from '../../services/vectorTileLegendService';

export default {
    name: 'VectorTileLayer',
    components: {},
    props: {
        map: {
            type: Object,
            required: true,
            validator: (value) => {
                return value && typeof value.addLayer === 'function';
            }
        },
        layer: {
            type: Object,
            required: true
        },
        info: {
            type: Object,
            required: false,  // Ya no lo usa este componente
            default: () => ({})
        },
        visible_columns: {
            type: Array,
            default: () => []
        },
        entity_type_id: {
            type: String,
            default: ''
        },
        base_url: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            vectorTileLayer: null,
            maplibreMap: null,
            sourceLayer: null,
            tileUrl: null,
            pointRenderMode: 'circle',
            isInitialized: false,
            // Referencias a handlers para poder limpiarlos
            leafletMouseMoveHandler: null,
            // Nombre del pane personalizado para esta capa
            customPaneName: null,
            // Flag para indicar si el estilo MapLibre ha sido cargado completamente
            styleLoaded: false
        };
    },
    watch: {
        map(newMap, oldMap) {
            if (!oldMap && newMap && !this.isInitialized) {
                this.createVectorTileLayer();
            }
        }
    },
    mounted() {
        // Crear la capa cuando el componente se monta
        if (this.map && typeof this.map.addLayer === 'function') {
            this.createVectorTileLayer();
        }
    },
    beforeDestroy() {
        this.cleanup();
    },
    methods: {
        async createVectorTileLayer() {
            /**
             * IMPORTANTE: Gestión del ciclo de vida de MapLibre GL con L.maplibreGL
             * 
             * MapLibre GL carga su estilo de forma asíncrona. Aunque la capa se renderice
             * visualmente, el estilo NO está listo para consultas (queryRenderedFeatures)
             * hasta que el evento 'load' se haya disparado.
             * 
             * Por eso:
             * 1. Creamos la capa con L.maplibreGL({ style: ... })
             * 2. Escuchamos el evento 'load' del maplibreMap
             * 3. Solo entonces marcamos styleLoaded = true
             * 4. tryHandleClick() y setupMouseMoveHandler() verifican styleLoaded antes de consultar
             * 
             * Sin esta verificación, queryRenderedFeatures() retorna array vacío y se ve el error:
             * "There is no style added to the map"
             * 
             * Referencia: https://github.com/maplibre/maplibre-gl-leaflet
             */
            if (!this.map || typeof this.map.addLayer !== 'function' || this.isInitialized) {
                return;
            }

            // Verificar que MapLibre GL Leaflet esté disponible
            if (!L.maplibreGL) {
                console.error('VectorTileLayer: L.maplibreGL no está disponible');
                return;
            }

            // Crear un pane único para esta capa vectorial
            // Esto permite que múltiples capas se apilen correctamente
            this.customPaneName = `vectorTilePane-${this.layer.id}`;
            let pane = this.map.getPane(this.customPaneName);
            
            if (!pane) {
                // Crear el pane si no existe
                pane = this.map.createPane(this.customPaneName);
                // NO usar pointerEvents: 'none' - necesitamos que capture eventos para detectar clicks
            } else {
                // El pane ya existe (reutilización al reactivar una capa)
                // Esto es OK - simplemente reutilizamos el pane
            }
            
            // SIEMPRE actualizar el z-index para reflejar el orden actual
            // z-index base para overlays es 400
            // Contar cuántos panes de vector tiles hay activos ANTES de este
            const baseZIndex = 400;
            const vectorTilePanes = Object.keys(this.map._panes)
                .filter(p => p.startsWith('vectorTilePane-') && p !== this.customPaneName)
                .map(p => this.map._panes[p])
                .filter(p => p.parentNode); // Solo panes que están actualmente en el DOM
            
            const newZIndex = baseZIndex + vectorTilePanes.length;
            pane.style.zIndex = newZIndex;


            // Preparar URL del tile con los parámetros {z}/{x}/{y}
            let tileUrl = this.layer.sh_map_has_layer_url;
            
            // Agregar parámetros {z}/{x}/{y} si no están presentes
            if (!tileUrl.includes('{z}') && !tileUrl.includes('{x}') && !tileUrl.includes('{y}')) {
                if (!tileUrl.endsWith('/')) {
                    tileUrl += '/';
                }
                tileUrl += '{z}/{x}/{y}.pbf';
            }

            this.tileUrl = tileUrl;

            const renderState = await this.resolveRenderState(tileUrl);

            this.sourceLayer =
                renderState.sourceLayerHint ||
                inferVectorTileLayerNameFromUrl(tileUrl) ||
                'default';

            if (this.isDestroyed()) {
                return;
            }
            
            // Crear el estilo MapLibre GL (Mapbox Style Spec v8)
            const maplibreStyle = {
                version: 8,
                sources: {
                    'vector-tiles': {
                        type: 'vector',
                        tiles: [tileUrl],
                        scheme: 'xyz',
                        minzoom: 0,
                        maxzoom: 22
                    }
                },
                glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
                layers: [
                    // NO incluir capa de fondo - dejar completamente transparente
                    ...this.createMapLibreLayers(renderState.styleExpressions)
                ]
            };

            this.emitLegend(renderState.legend);
            
            // Crear la capa MapLibre GL como capa de Leaflet
            this.vectorTileLayer = L.maplibreGL({
                style: maplibreStyle,
                attribution: this.layer.sh_map_has_layer_attribution || '',
                interactive: false,  // FALSE: Dejar que Leaflet maneje TODOS los eventos (evita patinado)
                pane: this.customPaneName,  // Usar el pane personalizado
                updateInterval: 16,  // Más frecuente para mejor sincronización (default: 32)
                padding: 0.1,  // Padding para evitar flickering en los bordes (default: 0.1)
                // Opciones para el contexto WebGL de MapLibre.
                // Esto es lo que permite a html2canvas leer el contenido del canvas.
                canvasContextAttributes: {
                    preserveDrawingBuffer: true,  // CRÍTICO para html2canvas: Preservar buffer para permitir captura
                    antialias: true,  // Mejorar calidad del rendering
                }
            });
            
            // Agregar la capa al mapa
            this.vectorTileLayer.addTo(this.map);
            
            // Obtener MapLibre GL map instance
            this.maplibreMap = this.vectorTileLayer.getMaplibreMap();
            
            // CRÍTICO: Esperar a que el estilo MapLibre se cargue completamente
            // Sin esto, queryRenderedFeatures() no funcionará
            this.maplibreMap.on('load', () => {
                this.styleLoaded = true;
            });

            // Generar imágenes de formas bajo demanda.
            // Cuando MapLibre necesita un icon-image 'vtl-shape-{shape}-{fill}-{stroke}'
            // que aún no existe, este handler lo genera en canvas con colores baked-in.
            this.maplibreMap.on('styleimagemissing', (e) => {
                const id = e.id;
                if (id && id.startsWith('vtl-shape-')) {
                    // Formato: vtl-shape-{shape}-{fillHex}-{strokeHex}-{strokeWidth}
                    const rest = id.substring('vtl-shape-'.length);
                    const parts = rest.split('-');
                    const shape = parts[0] || 'circle';
                    const fill = '#' + (parts[1] || '3388ff');
                    const stroke = '#' + (parts[2] || parts[1] || '3388ff');
                    const sw = Number(parts[3]) || 3;
                    this.generateColoredShapeImage(id, shape, fill, stroke, sw);
                }
            });
            
            // Asegurar que el canvas esté correctamente configurado
            this.configureCanvas();
            
            // Si hay icono personalizado, cargarlo
            if (this.layer.sh_map_has_layer_point_image) {
                this.loadCustomIcon();
            }
            
            // NO configurar eventos aquí - el padre los maneja centralizadamente
            // para evitar que múltiples capas compitan por el mismo click
            
            // Configurar solo el handler de mousemove para el cursor
            this.setupMouseMoveHandler();
            
            this.isInitialized = true;
        },

        isDestroyed() {
            return this._isBeingDestroyed || this._isDestroyed;
        },

        async resolveRenderState(tileUrl) {
            const defaultRenderState = {
                styleExpressions: buildDefaultVectorTilePaint(this.layer),
                legend: null,
                sourceLayerHint: null,
            };

            const legendConfig = normalizeVectorTileLegendConfig(this.layer);

            if (!legendConfig || legendConfig.mode !== 'semantic' || !legendConfig.layerName || !legendConfig.attribute) {
                return defaultRenderState;
            }

            try {
                const semanticLegend = await fetchVectorTileSemanticLegend({
                    tileUrl,
                    layerName: legendConfig.layerName,
                    attribute: legendConfig.attribute,
                });

                if (!semanticLegend || this.isDestroyed()) {
                    return defaultRenderState;
                }

                return buildVectorTileSemanticRenderState({
                    layer: this.layer,
                    config: legendConfig,
                    semanticLegend,
                });
            } catch (error) {
                console.warn(`VectorTileLayer: No fue posible cargar la leyenda semántica para capa ${this.layer.id}`, error);
                return defaultRenderState;
            }
        },

        emitLegend(legend) {
            if (!legend || legend.visible === false) {
                this.$emit('legend-clear', this.layer.id);
                return;
            }

            this.$emit('legend-ready', {
                layerId: this.layer.id,
                legend,
            });
        },
        
        /**
         * Configura el canvas de MapLibre para evitar problemas de superposición
         * y asegurar transparencia completa
         */
        configureCanvas() {
            if (!this.maplibreMap || !this.vectorTileLayer) return;
            
            // Esperar a que MapLibre esté listo
            this.maplibreMap.once('load', () => {
                // Obtener el canvas usando el método de L.maplibreGL
                const canvas = this.vectorTileLayer.getCanvas();
                if (canvas) {
                    // En modo no-interactivo, el canvas NO debe capturar eventos
                    canvas.style.pointerEvents = 'none';
                    
                    // CRÍTICO: Hacer el canvas completamente transparente
                    canvas.style.backgroundColor = 'transparent';
                    canvas.style.opacity = '1';
                    
                    // Usar mix-blend-mode para mezclar con las capas debajo
                    canvas.style.mixBlendMode = 'normal';
                    
                    // Asegurar que el canvas esté posicionado correctamente
                    canvas.style.position = 'absolute';
                    canvas.style.top = '0';
                    canvas.style.left = '0';
                }
                
                // También configurar el contenedor
                const container = this.vectorTileLayer.getContainer();
                if (container) {
                    container.style.pointerEvents = 'none';
                    container.style.backgroundColor = 'transparent';
                    container.style.opacity = '1';
                }
            });
        },
        
        /**
         * Intenta manejar un click en esta capa
         * Retorna true si encontró un feature y manejó el click, false si no
         * @param {Object} e - Evento de click de Leaflet
         * @returns {boolean} - True si se manejó el click, false si no
         */
        tryHandleClick(e) {
            // Verificaciones previas
            if (!this.maplibreMap) return false;
            
            // CRÍTICO: Verificar que el estilo esté completamente cargado
            // Sin esto, queryRenderedFeatures() retornará array vacío
            if (!this.styleLoaded) {
                console.warn(`VectorTileLayer: Estilo no cargado aún para capa ${this.layer.id}, ignorando click`);
                return false;
            }
            
            // Convertir coordenadas Leaflet LatLng a Point de MapLibre GL
            const maplibrePoint = this.maplibreMap.project([e.latlng.lng, e.latlng.lat]);
            
            // Crear lista de layers a consultar
            const layerIds = [
                `${this.layer.id}-fill`,
                `${this.layer.id}-line-border`,
                `${this.layer.id}-line`
            ];
            
            // Agregar layers de puntos que existen en el estilo
            layerIds.push(...this.getPointLayerIds());
            
            // Consultar features en el punto clickeado
            const features = this.maplibreMap.queryRenderedFeatures(maplibrePoint, {
                layers: layerIds.filter(id => {
                    try { return Boolean(this.maplibreMap.getLayer(id)); }
                    catch (_e) { return false; }
                })
            });
            
            if (features.length > 0) {
                const feature = features[0];
                const properties = feature.properties;
                
                // Crear y mostrar el popup
                this.showPopup(properties, [e.latlng.lat, e.latlng.lng]);
                
                // Emitir evento para que el padre pueda reaccionar si necesita
                this.$emit('feature-click', {
                    layer: this.layer,
                    feature: feature,
                    properties: properties,
                    latlng: [e.latlng.lat, e.latlng.lng]
                });
                
                return true; // Click manejado
            }
            
            return false; // No se encontró feature
        },
        
        /**
         * Configura el handler de mousemove para cambiar el cursor
         */
        setupMouseMoveHandler() {
            if (!this.map || !this.maplibreMap) return;
            
            const self = this;
            
            // Handler de mousemove para cambiar cursor
            this.leafletMouseMoveHandler = function(e) {
                if (!self.maplibreMap || !self.styleLoaded) {
                    // Si el estilo no está cargado, no hacer nada
                    return;
                }
                
                const maplibrePoint = self.maplibreMap.project([e.latlng.lng, e.latlng.lat]);
                const layerIds = [
                    `${self.layer.id}-fill`,
                    `${self.layer.id}-line-border`,
                    `${self.layer.id}-line`,
                    ...self.getPointLayerIds()
                ].filter(id => {
                    try { return Boolean(self.maplibreMap.getLayer(id)); }
                    catch (_e) { return false; }
                });
                
                const features = self.maplibreMap.queryRenderedFeatures(maplibrePoint, {
                    layers: layerIds
                });
                
                // Cambiar cursor si hay features bajo el mouse
                if (features.length > 0) {
                    self.map.getContainer().style.cursor = 'pointer';
                }
            };
            
            this.map.on('mousemove', this.leafletMouseMoveHandler);
        },
        
        /**
         * Carga el icono personalizado en MapLibre GL
         */
        loadCustomIcon() {
            if (!this.maplibreMap) return;

            const rawIconRef = String(this.layer.sh_map_has_layer_point_image || '').trim();
            if (!rawIconRef) return;

            let iconUrl = '';

            if (/^https?:\/\//i.test(rawIconRef)) {
                iconUrl = rawIconRef;
            } else if (rawIconRef.startsWith('/')) {
                iconUrl = `${this.base_url}${rawIconRef}`;
            } else {
                iconUrl = `${this.base_url}/document/${rawIconRef}`;
            }

            const iconId = `${this.layer.id}-icon`;

            const loadIcon = () => {
                this.maplibreMap.loadImage(iconUrl, (error, image) => {
                    if (error) {
                        console.error('VectorTileLayer: Error cargando icono', iconUrl, error);
                        return;
                    }

                    if (!this.maplibreMap.hasImage(iconId)) {
                        this.maplibreMap.addImage(iconId, image);
                    }
                });
            };

            if (typeof this.maplibreMap.isStyleLoaded === 'function' && this.maplibreMap.isStyleLoaded()) {
                loadIcon();
                return;
            }

            this.maplibreMap.once('load', loadIcon);
        },

        /**
         * Genera una imagen en canvas de alta resolución con colores baked-in.
         * NO usa SDF — los colores están pintados directamente en la imagen.
         * Esto produce formas nítidas sin distorsión de esquinas.
         *
         * @param {string} imageId — ID único para MapLibre
         * @param {string} shape — circle | square | triangle | diamond
         * @param {string} fillColor — color de relleno hex (#4E79A7)
         * @param {string} strokeColor — color de borde hex (#3A5A80)
         * @param {number} strokeWidth — grosor del borde en píxeles de canvas
         */
        generateColoredShapeImage(imageId, shape, fillColor, strokeColor, strokeWidth) {
            if (this.maplibreMap.hasImage(imageId)) return;

            const size = 128;
            const sw = Math.max(1, Math.min(12, strokeWidth || 3));
            // Escalar al canvas de 128px: un strokeWidth de 3 lógico → ~6px en canvas
            const scaledSw = Math.round(sw * 2);
            const padding = scaledSw + 2;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const center = size / 2;
            const r = (size / 2) - padding;

            ctx.beginPath();

            switch (shape) {
                case 'square': {
                    const side = r * 1.6;
                    const half = side / 2;
                    ctx.rect(center - half, center - half, side, side);
                    break;
                }
                case 'triangle':
                    ctx.moveTo(center, center - r);
                    ctx.lineTo(center + r * 0.87, center + r * 0.75);
                    ctx.lineTo(center - r * 0.87, center + r * 0.75);
                    ctx.closePath();
                    break;
                case 'diamond': {
                    // Cuadrado rotado 45°
                    const side = r * 1.15;
                    ctx.save();
                    ctx.translate(center, center);
                    ctx.rotate(Math.PI / 4);
                    ctx.rect(-side / 2, -side / 2, side, side);
                    ctx.restore();
                    break;
                }
                default: // circle
                    ctx.arc(center, center, r, 0, Math.PI * 2);
                    break;
            }

            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = scaledSw;
            ctx.lineJoin = 'miter';
            ctx.stroke();

            const imageData = ctx.getImageData(0, 0, size, size);
            this.maplibreMap.addImage(imageId, {
                width: size,
                height: size,
                data: new Uint8Array(imageData.data.buffer),
            });
        },

        /**
         * Construye la expresión icon-image para formas con colores baked-in.
         * Cada clase del atributo se mapea a un imageId único que codifica shape+fill+stroke.
         *
         * @param {string} attribute — nombre del atributo (e.g. 'tipo_de_un')
         * @param {Array} legendItems — items resueltos con fill, stroke, pointShape, expressionKey
         * @param {string} fallbackFill — color fill para el fallback
         * @param {string} fallbackStroke — color stroke para el fallback
         * @returns {string|Array} — ID de imagen o expresión match
         */
        buildColoredShapeIconExpression(attribute, legendItems, fallbackFill, fallbackStroke) {
            const makeImageId = (shape, fill, stroke, sw) => {
                const f = (fill || '#3388ff').replace('#', '');
                const s = (stroke || f).replace('#', '');
                const w = Math.round(Number(sw) || 3);
                return `vtl-shape-${shape || 'circle'}-${f}-${s}-${w}`;
            };

            if (!attribute || !Array.isArray(legendItems) || legendItems.length === 0) {
                return makeImageId('circle', fallbackFill, fallbackStroke, 3);
            }

            const expression = [
                'match',
                ['to-string', ['coalesce', ['get', attribute], '__VECTOR_TILE_NULL__']],
            ];

            legendItems.forEach(item => {
                expression.push(item.expressionKey);
                expression.push(makeImageId(item.pointShape, item.fill, item.stroke, item.pointStrokeWidth));
            });

            expression.push(makeImageId('circle', fallbackFill, fallbackStroke, 3));
            return expression;
        },

        pointGeometryFilter() {
            return ['==', '$type', 'Point'];
        },

        /**
         * Retorna los IDs de layers de puntos candidatos según el modo de renderizado.
         * Se usa para queryRenderedFeatures (click/hover).
         */
        getPointLayerIds() {
            if (this.pointRenderMode === 'symbol') {
                return [
                    `${this.layer.id}-symbol`,
                    `${this.layer.id}-circle-fallback`,
                ];
            }

            return [`${this.layer.id}-circle`];
        },
        
        createMapLibreLayers(styleExpressions = null) {
            const layers = [];
            const resolvedStyleExpressions = styleExpressions || buildDefaultVectorTilePaint(this.layer);
            const fillColorExpression = resolvedStyleExpressions.fillColorExpression;
            const strokeColorExpression = resolvedStyleExpressions.strokeColorExpression;
            const pointRadiusExpression = resolvedStyleExpressions.pointRadiusExpression || 8;
            const pointStrokeWidthExpression = resolvedStyleExpressions.pointStrokeWidthExpression || 3;
            const useSymbolForPointShape = Boolean(
                resolvedStyleExpressions.useSymbolForPointShape && !this.layer.sh_map_has_layer_point_image
            );
            
            // Capa para polígonos
            layers.push({
                id: `${this.layer.id}-fill`,
                type: 'fill',
                source: 'vector-tiles',
                'source-layer': this.sourceLayer,
                filter: ['==', '$type', 'Polygon'],
                paint: {
                    'fill-color': fillColorExpression,
                    'fill-opacity': 0.6
                }
            });
            
            // Capa para bordes de polígonos
            layers.push({
                id: `${this.layer.id}-line-border`,
                type: 'line',
                source: 'vector-tiles',
                'source-layer': this.sourceLayer,
                filter: ['==', '$type', 'Polygon'],
                paint: {
                    'line-color': strokeColorExpression,
                    'line-width': 2,
                    'line-opacity': 0.8
                }
            });

            // Capa para líneas standalone (calles, ríos, etc.)
            // Usa fillColorExpression para que coincida con la leyenda
            layers.push({
                id: `${this.layer.id}-line`,
                type: 'line',
                source: 'vector-tiles',
                'source-layer': this.sourceLayer,
                filter: ['==', '$type', 'LineString'],
                paint: {
                    'line-color': fillColorExpression,
                    'line-width': 2.5,
                    'line-opacity': 0.85
                }
            });
            
            // Capa para puntos: Usar icono personalizado SI existe, sino círculo
            if (this.layer.sh_map_has_layer_point_image) {
                this.pointRenderMode = 'symbol';
                layers.push({
                    id: `${this.layer.id}-circle-fallback`,
                    type: 'circle',
                    source: 'vector-tiles',
                    'source-layer': this.sourceLayer,
                    filter: this.pointGeometryFilter(),
                    paint: {
                        'circle-radius': pointRadiusExpression,
                        'circle-color': fillColorExpression,
                        'circle-stroke-width': pointStrokeWidthExpression,
                        'circle-stroke-color': strokeColorExpression,
                        'circle-opacity': 0.85
                    }
                });
                // Layer tipo SYMBOL con icono personalizado
                layers.push({
                    id: `${this.layer.id}-symbol`,
                    type: 'symbol',
                    source: 'vector-tiles',
                    'source-layer': this.sourceLayer,
                    filter: this.pointGeometryFilter(),
                    layout: {
                        'icon-image': `${this.layer.id}-icon`,
                        'icon-size': 0.8,
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true
                    }
                });
            } else if (useSymbolForPointShape) {
                // Formas custom via imágenes canvas con colores baked-in (NO SDF).
                // Las imágenes se generan instantáneamente via styleimagemissing.
                this.pointRenderMode = 'symbol';
                const legendItems = resolvedStyleExpressions.legendItems || [];
                const legendAttribute = resolvedStyleExpressions.legendAttribute;
                const defaultFill = resolvedStyleExpressions.defaultFillColor || '#3388ff';
                const defaultStroke = resolvedStyleExpressions.defaultStrokeColor || '#3388ff';

                // Symbol layer con iconos de formas coloreadas
                layers.push({
                    id: `${this.layer.id}-symbol`,
                    type: 'symbol',
                    source: 'vector-tiles',
                    'source-layer': this.sourceLayer,
                    filter: this.pointGeometryFilter(),
                    layout: {
                        'icon-image': this.buildColoredShapeIconExpression(
                            legendAttribute, legendItems, defaultFill, defaultStroke
                        ),
                        'icon-size': ['/', pointRadiusExpression, 32],
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                    }
                });
            } else {
                this.pointRenderMode = 'circle';
                // Layer tipo CIRCLE (sin icono) - también usa colores dinámicos
                layers.push({
                    id: `${this.layer.id}-circle`,
                    type: 'circle',
                    source: 'vector-tiles',
                    'source-layer': this.sourceLayer,
                    filter: this.pointGeometryFilter(),
                    paint: {
                        'circle-radius': pointRadiusExpression,
                        'circle-color': fillColorExpression, // Color dinámico desde 'Fill'
                        'circle-stroke-width': pointStrokeWidthExpression,
                        'circle-stroke-color': strokeColorExpression, // Color dinámico desde 'Stroke'
                        'circle-opacity': 1.0
                    }
                });
            }
            
            return layers;
        },
        
        /**
         * Muestra el popup con la información del feature
         */
        showPopup(properties, latlng) {
            // Cerrar popup previo
            this.map.closePopup();
            
            // Convertir propiedades a formato de marker
            const marker = {
                has_data: true,
                id: properties.id || null,
                data: properties
            };
            
            // Generar HTML del contenido
            const content = this.generatePopupContent(marker);
            
            // Crear y abrir popup
            L.popup({
                maxWidth: 300,
                minWidth: 300,
                maxHeight: 300,
                closeButton: true,
                autoClose: false,
                closeOnClick: false,
                autoPan: false,
                className: 'popupCustom'
            })
                .setContent(content)
                .setLatLng(latlng)
                .openOn(this.map);
            
            // Aplicar z-index para estar sobre MapLibre canvas
            setTimeout(() => {
                const popupElement = document.querySelector('.leaflet-popup');
                if (popupElement) {
                    popupElement.style.zIndex = '10000';
                    const closeBtn = popupElement.querySelector('.leaflet-popup-close-button');
                    if (closeBtn) closeBtn.style.zIndex = '10001';
                }
            }, 10);
        },
        
        /**
         * Genera el HTML del contenido del popup
         * Replica EXACTAMENTE la estructura de PopUpMarker.vue
         */
        generatePopupContent(marker) {
            if (!marker.has_data) {
                return '<div class="marker-pop-up-single-info">Cargando...</div>';
            }
            
            let info = [];
            
            // Si hay visible_columns configuradas, mostrar solo esas
            if (this.visible_columns && this.visible_columns.length > 0) {
                info = this.visible_columns.map(col => {
                    const value = marker.data[col.id] === 'NULL' || marker.data[col.id] === null 
                        ? 'Sin información disponible' 
                        : marker.data[col.id];
                    
                    const formattedValue = (value === 'Sin información disponible') 
                        ? value 
                        : (isNaN(value) ? value : Number(value).toLocaleString('es-ES'));
                    
                    // Si es URL, crear enlace
                    const content = (col.format === 'URL' && value !== 'Sin información disponible')
                        ? `<a href="${formattedValue}">${formattedValue}</a>`
                        : formattedValue;
                    
                    return `
                        <div class="marker-pop-up-single-info">
                            <span class="marker-pop-up-info-title"><b>${col.name}</b></span>
                            <br />
                            <span class="marker-pop-up-info-content">${content}</span>
                        </div>
                    `;
                });
            } else {
                // Si NO hay visible_columns, mostrar todas las propiedades
                info = Object.entries(marker.data).map(([key, value]) => {
                    const title = this.formatKeyToHumanText(key);
                    const formattedValue = (value == null || value === 'NULL') 
                        ? 'Sin información disponible' 
                        : (isNaN(value) ? value : Number(value).toLocaleString('es-ES'));
                    
                    // Detectar URLs automáticamente
                    const content = (typeof value === 'string' && 
                                    (value.startsWith('http://') || value.startsWith('https://')))
                        ? `<a href="${formattedValue}">${formattedValue}</a>`
                        : formattedValue;
                    
                    return `
                        <div class="marker-pop-up-single-info">
                            <span class="marker-pop-up-info-title"><b>${title}</b></span>
                            <br />
                            <span class="marker-pop-up-info-content">${content}</span>
                        </div>
                    `;
                });
            }
            
            // Envolver en el div container con clase CSS correcta
            return `<div class="marker-pop-up-content">${info.join('')}</div>`;
        },
        
        /**
         * Formatea un key de propiedad a texto legible
         */
        formatKeyToHumanText(text) {
            let textFormated = text.replace(/_/g, " ");
            textFormated = textFormated.toLowerCase();
            textFormated = textFormated.replace(/(?:^|\s)\S/g, a => a.toUpperCase());
            textFormated = textFormated.replace(/([a-z])([0-9])/i, '$1 $2');
            textFormated = textFormated.replace(/([0-9])([a-z])/i, '$1 $2');
            return textFormated;
        },
        
        // debugVectorTiles() {
        //     // Método de debugging - Comentado para evitar logs innecesarios
        //     // Descomentar solo si necesitas debuggear problemas con vector tiles
        // },
        
        removeLayer() {
            if (this.vectorTileLayer && this.map && this.map.hasLayer(this.vectorTileLayer)) {
                this.map.removeLayer(this.vectorTileLayer);
            }
        },
        
        cleanup() {
            // Cerrar popups
            if (this.map) {
                this.map.closePopup();
            }
            
            // Remover event listeners de LEAFLET que nosotros agregamos
            if (this.map) {
                if (this.leafletMouseMoveHandler) {
                    this.map.off('mousemove', this.leafletMouseMoveHandler);
                    this.leafletMouseMoveHandler = null;
                }
                
                // Resetear cursor
                if (this.map.getContainer()) {
                    this.map.getContainer().style.cursor = '';
                }
            }
            
            // Resetear flag de estilo cargado
            this.styleLoaded = false;

            this.$emit('legend-clear', this.layer.id);
            
            // Remover capa del mapa usando el método de Leaflet
            // Esto llamará automáticamente al onRemove de L.maplibreGL que
            // limpiará el canvas, la sincronización y recursos internos
            this.removeLayer();
            
            // NO remover el pane - lo reutilizaremos si la capa se reactiva
            // Esto evita race conditions al destruir/crear componentes rápidamente
            
            // Limpiar referencias
            this.vectorTileLayer = null;
            this.maplibreMap = null;
            this.customPaneName = null;
            this.tileUrl = null;
            this.pointRenderMode = 'circle';
            this.isInitialized = false;
        }
    }
};
</script>
