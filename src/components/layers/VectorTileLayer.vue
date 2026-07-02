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
        },
        opacity: {
            type: Number,
            default: 1
        },
        highlightColor: {
            type: String,
            default: '#FFEB3B'
        },
        highlightWeight: {
            type: Number,
            default: 4
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
            currentStyleExpressions: null,
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
        },
        'layer.sh_map_has_layer_render_state': {
            deep: true,
            handler() {
                this.applyRenderStateToLiveLayer();
            }
        },
        opacity() {
            // Aplicación síncrona desde el cache: evita re-disparar resolveRenderState()
            // (que puede refetchear la leyenda semántica) en cada tick del slider.
            this.applyStyleExpressionsToLiveLayer(this.currentStyleExpressions);
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
    computed: {
        highlightSourceId() {
            return `${this.layer.id}-highlight-source`;
        }
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
            const baseZIndex = 350;
            const vectorTilePanes = Object.keys(this.map._panes)
                .filter(p => p.startsWith('vectorTilePane-') && p !== this.customPaneName)
                .map(p => this.map._panes[p])
                .filter(p => p.parentNode); // Solo panes que están actualmente en el DOM
            
            const newZIndex = baseZIndex + vectorTilePanes.length;
            pane.style.zIndex = newZIndex;
            pane.style.pointerEvents = 'none';


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
            this.currentStyleExpressions = renderState.styleExpressions;

            // Orden de prioridad para sourceLayer:
            // 1. Hint devuelto por el backend de leyenda semántica (layer_name en la respuesta)
            // 2. Inferido desde el patrón /vector/tiles/{name} en la URL
            // 3. Fallback 'default'
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
                    },
                    [this.highlightSourceId]: {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    }
                },
                glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
                layers: [
                    // NO incluir capa de fondo - dejar completamente transparente
                    ...this.createMapLibreLayers(renderState.styleExpressions),
                    // Capas de highlight del feature seleccionado, siempre al tope
                    ...this.createHighlightLayers()
                ]
            };

            this.emitLegend(renderState.legend);

            const requestHeaders =
                this.layer.sh_map_request_headers && typeof this.layer.sh_map_request_headers === 'object'
                    ? this.layer.sh_map_request_headers
                    : {};
            const requestAuthMode =
                typeof this.layer.sh_map_request_auth_mode === 'string'
                    ? this.layer.sh_map_request_auth_mode
                    : '';
            
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
                },
                transformRequest: (url) => {
                    const headers = {
                        ...requestHeaders,
                    };
                    const runtimeAuth = window.__OGP_RUNTIME_AUTH__ || {};
                    if (
                        requestAuthMode === 'ogp-bearer' &&
                        typeof runtimeAuth.getBearerToken === 'function'
                    ) {
                        const runtimeToken = runtimeAuth.getBearerToken();
                        if (typeof runtimeToken === 'string' && runtimeToken.length > 0) {
                            headers.Authorization = `Bearer ${runtimeToken}`;
                        }
                    }

                    return {
                        url,
                        headers,
                    };
                },
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
            // Cubre la carrera donde 'load' ya se disparó antes de registrar el listener
            // de arriba (posible si el hilo se demora en llegar hasta acá).
            if (this.maplibreMap.isStyleLoaded()) {
                this.styleLoaded = true;
            }

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
            const explicitRenderState = this.layer.sh_map_has_layer_render_state;
            const defaultRenderState = {
                styleExpressions:
                    explicitRenderState?.styleExpressions ||
                    buildDefaultVectorTilePaint(this.layer),
                legend: null,
                sourceLayerHint:
                    explicitRenderState?.sourceLayerHint ||
                    this.layer.sh_map_has_layer_vector_source_layer ||
                    null,
            };

            if (explicitRenderState?.legend) {
                defaultRenderState.legend = explicitRenderState.legend;
            }

            if (explicitRenderState?.styleExpressions) {
                return defaultRenderState;
            }

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
            const legendMode = this.layer.sh_map_has_layer_legend_mode || 'internal';
            if (legendMode === 'external' || legendMode === 'none') {
                this.$emit('legend-clear', this.layer.id);
                return;
            }
            if (!legend || legend.visible === false) {
                this.$emit('legend-clear', this.layer.id);
                return;
            }

            this.$emit('legend-ready', {
                layerId: this.layer.id,
                legend,
            });
        },

        // Escala una expresión de opacidad (número plano o expression array de MapLibre)
        // por el factor de opacidad de la capa (prop `opacity`, 0-1).
        scaleOpacity(expr) {
            if (typeof expr === 'number') return expr * this.opacity;
            return ['*', expr, this.opacity];
        },

        resolveStylePaint(styleExpressions = null) {
            const resolvedStyleExpressions = styleExpressions || buildDefaultVectorTilePaint(this.layer);
            const fillColorExpression = resolvedStyleExpressions.fillColorExpression;
            const strokeColorExpression = resolvedStyleExpressions.strokeColorExpression;

            return {
                fillColorExpression,
                strokeColorExpression,
                pointRadiusExpression: resolvedStyleExpressions.pointRadiusExpression ?? 8,
                pointStrokeWidthExpression: resolvedStyleExpressions.pointStrokeWidthExpression ?? 3,
                polygonFillOpacityExpression: this.scaleOpacity(resolvedStyleExpressions.polygonFillOpacityExpression ?? 0.6),
                polygonStrokeWidthExpression: resolvedStyleExpressions.polygonStrokeWidthExpression ?? 2,
                polygonStrokeOpacityExpression: this.scaleOpacity(resolvedStyleExpressions.polygonStrokeOpacityExpression ?? 0.8),
                polygonBorderEnabled: resolvedStyleExpressions.polygonBorderEnabled !== false,
                lineWidthExpression: resolvedStyleExpressions.lineWidthExpression ?? 2.5,
                lineOpacityExpression: this.scaleOpacity(resolvedStyleExpressions.lineOpacityExpression ?? 0.85),
                circleOpacityExpression: this.scaleOpacity(resolvedStyleExpressions.circleOpacityExpression ?? 1.0),
                circleFallbackOpacityExpression: this.scaleOpacity(resolvedStyleExpressions.circleFallbackOpacityExpression ?? 0.85),
                iconOpacityExpression: this.scaleOpacity(1),
                useSymbolForPointShape: Boolean(
                    resolvedStyleExpressions.useSymbolForPointShape && !this.layer.sh_map_has_layer_point_image
                ),
                legendItems: resolvedStyleExpressions.legendItems || [],
                legendAttribute: resolvedStyleExpressions.legendAttribute,
                defaultFillColor: resolvedStyleExpressions.defaultFillColor || '#3388ff',
                defaultStrokeColor: resolvedStyleExpressions.defaultStrokeColor || '#3388ff',
            };
        },

        shouldRenderPolygonBorder(paint) {
            if (!paint || paint.polygonBorderEnabled === false) return false;

            if (typeof paint.polygonStrokeWidthExpression === 'number') {
                return paint.polygonStrokeWidthExpression > 0;
            }

            if (typeof paint.polygonStrokeWidthExpression === 'string') {
                const parsedStrokeWidth = Number(paint.polygonStrokeWidthExpression);
                return !Number.isFinite(parsedStrokeWidth) || parsedStrokeWidth > 0;
            }

            return true;
        },

        setPaintPropertyIfExists(layerId, property, value) {
            if (!this.maplibreMap || !this.maplibreMap.getLayer(layerId)) return;
            this.maplibreMap.setPaintProperty(layerId, property, value);
        },

        setLayoutPropertyIfExists(layerId, property, value) {
            if (!this.maplibreMap || !this.maplibreMap.getLayer(layerId)) return;
            this.maplibreMap.setLayoutProperty(layerId, property, value);
        },

        // Layers de highlight del feature clickeado: un line layer (polígonos/líneas) y un
        // circle layer en modo anillo/halo (puntos, no tapa el ícono/símbolo original).
        createHighlightLayers() {
            return [
                {
                    id: `${this.layer.id}-highlight-line`,
                    type: 'line',
                    source: this.highlightSourceId,
                    filter: ['in', '$type', 'Polygon', 'LineString'],
                    paint: {
                        'line-color': this.highlightColor,
                        'line-width': this.highlightWeight
                    }
                },
                {
                    id: `${this.layer.id}-highlight-circle`,
                    type: 'circle',
                    source: this.highlightSourceId,
                    filter: ['==', '$type', 'Point'],
                    paint: {
                        'circle-radius': 14,
                        'circle-color': 'transparent',
                        'circle-stroke-width': this.highlightWeight,
                        'circle-stroke-color': this.highlightColor
                    }
                }
            ];
        },

        // Marca visualmente el feature clickeado (geometría exacta de queryRenderedFeatures,
        // sin necesitar id/promoteId en la fuente de tiles).
        setHighlightFeature(feature) {
            const source = this.maplibreMap && this.maplibreMap.getSource(this.highlightSourceId);
            if (!source) return;

            source.setData({
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: feature.geometry, properties: {} }]
            });
        },

        // Público: usado por SheetsMap.vue para limpiar el highlight de esta capa
        // cuando se selecciona un feature de otra capa (u otro mecanismo, ej. GeoJSON).
        clearHighlight() {
            if (!this.maplibreMap || !this.styleLoaded) return;
            const source = this.maplibreMap.getSource(this.highlightSourceId);
            if (!source) return;

            source.setData({ type: 'FeatureCollection', features: [] });
        },

        applyStyleExpressionsToLiveLayer(styleExpressions = null) {
            if (!this.maplibreMap) return;

            const paint = this.resolveStylePaint(styleExpressions);

            this.setPaintPropertyIfExists(`${this.layer.id}-fill`, 'fill-color', paint.fillColorExpression);
            this.setPaintPropertyIfExists(`${this.layer.id}-fill`, 'fill-opacity', paint.polygonFillOpacityExpression);

            if (this.shouldRenderPolygonBorder(paint)) {
                this.setPaintPropertyIfExists(`${this.layer.id}-line-border`, 'line-color', paint.strokeColorExpression);
                this.setPaintPropertyIfExists(`${this.layer.id}-line-border`, 'line-width', paint.polygonStrokeWidthExpression);
                this.setPaintPropertyIfExists(`${this.layer.id}-line-border`, 'line-opacity', paint.polygonStrokeOpacityExpression);
            } else {
                this.setPaintPropertyIfExists(`${this.layer.id}-line-border`, 'line-width', 0);
                this.setPaintPropertyIfExists(`${this.layer.id}-line-border`, 'line-opacity', 0);
            }

            this.setPaintPropertyIfExists(`${this.layer.id}-line`, 'line-color', paint.fillColorExpression);
            this.setPaintPropertyIfExists(`${this.layer.id}-line`, 'line-width', paint.lineWidthExpression);
            this.setPaintPropertyIfExists(`${this.layer.id}-line`, 'line-opacity', paint.lineOpacityExpression);

            [
                [`${this.layer.id}-circle`, paint.circleOpacityExpression],
                [`${this.layer.id}-circle-fallback`, paint.circleFallbackOpacityExpression],
            ].forEach(([layerId, circleOpacity]) => {
                this.setPaintPropertyIfExists(layerId, 'circle-radius', paint.pointRadiusExpression);
                this.setPaintPropertyIfExists(layerId, 'circle-color', paint.fillColorExpression);
                this.setPaintPropertyIfExists(layerId, 'circle-stroke-width', paint.pointStrokeWidthExpression);
                this.setPaintPropertyIfExists(layerId, 'circle-stroke-color', paint.strokeColorExpression);
                this.setPaintPropertyIfExists(layerId, 'circle-opacity', circleOpacity);
            });

            this.setPaintPropertyIfExists(`${this.layer.id}-symbol`, 'icon-opacity', paint.iconOpacityExpression);

            if (paint.useSymbolForPointShape) {
                this.setLayoutPropertyIfExists(
                    `${this.layer.id}-symbol`,
                    'icon-image',
                    this.buildColoredShapeIconExpression(
                        paint.legendAttribute,
                        paint.legendItems,
                        paint.defaultFillColor,
                        paint.defaultStrokeColor
                    )
                );
                this.setLayoutPropertyIfExists(`${this.layer.id}-symbol`, 'icon-size', ['/', paint.pointRadiusExpression, 32]);
            }
        },

        async applyRenderStateToLiveLayer() {
            if (!this.maplibreMap || !this.isInitialized) return;

            const tileUrl = this.tileUrl || this.layer.sh_map_has_layer_url || '';
            const renderState = await this.resolveRenderState(tileUrl);
            if (this.isDestroyed()) return;

            this.currentStyleExpressions = renderState.styleExpressions;
            this.applyStyleExpressionsToLiveLayer(renderState.styleExpressions);
            this.emitLegend(renderState.legend);
        },
        
        /**
         * Configura el canvas de MapLibre para evitar problemas de superposición
         * y asegurar transparencia completa
         */
        configureCanvas() {
            if (!this.maplibreMap || !this.vectorTileLayer) return;

            const applyCanvasStyles = () => {
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
            };

            // Esperar a que MapLibre esté listo (con respaldo síncrono por si 'load' ya se disparó)
            this.maplibreMap.once('load', applyCanvasStyles);
            if (this.maplibreMap.isStyleLoaded()) {
                applyCanvasStyles();
            }
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
                
                // Resaltar el feature clickeado
                this.setHighlightFeature(feature);

                // Emitir evento para que el padre pueda reaccionar si necesita
                this.$emit('feature-click', {
                    layer: this.layer,
                    feature: feature,
                    properties: properties,
                    latlng: [e.latlng.lat, e.latlng.lng],
                    visible_columns: this.visible_columns
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
            const paint = this.resolveStylePaint(styleExpressions);
            
            // Capa para polígonos
            layers.push({
                id: `${this.layer.id}-fill`,
                type: 'fill',
                source: 'vector-tiles',
                'source-layer': this.sourceLayer,
                filter: ['==', '$type', 'Polygon'],
                paint: {
                    'fill-color': paint.fillColorExpression,
                    'fill-opacity': paint.polygonFillOpacityExpression
                }
            });
            
            // Capa para bordes de polígonos.
            // Si se desactiva, no se agrega al estilo para evitar que se vean
            // los cortes internos que produce el clipping de cada vector tile.
            if (this.shouldRenderPolygonBorder(paint)) {
                layers.push({
                    id: `${this.layer.id}-line-border`,
                    type: 'line',
                    source: 'vector-tiles',
                    'source-layer': this.sourceLayer,
                    filter: ['==', '$type', 'Polygon'],
                    paint: {
                        'line-color': paint.strokeColorExpression,
                        'line-width': paint.polygonStrokeWidthExpression,
                        'line-opacity': paint.polygonStrokeOpacityExpression
                    }
                });
            }

            // Capa para líneas standalone (calles, ríos, etc.)
            // Usa fillColorExpression para que coincida con la leyenda
            layers.push({
                id: `${this.layer.id}-line`,
                type: 'line',
                source: 'vector-tiles',
                'source-layer': this.sourceLayer,
                filter: ['==', '$type', 'LineString'],
                paint: {
                    'line-color': paint.fillColorExpression,
                    'line-width': paint.lineWidthExpression,
                    'line-opacity': paint.lineOpacityExpression
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
                        'circle-radius': paint.pointRadiusExpression,
                        'circle-color': paint.fillColorExpression,
                        'circle-stroke-width': paint.pointStrokeWidthExpression,
                        'circle-stroke-color': paint.strokeColorExpression,
                        'circle-opacity': paint.circleFallbackOpacityExpression
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
                    },
                    paint: {
                        'icon-opacity': paint.iconOpacityExpression
                    }
                });
            } else if (paint.useSymbolForPointShape) {
                // Formas custom via imágenes canvas con colores baked-in (NO SDF).
                // Las imágenes se generan instantáneamente via styleimagemissing.
                this.pointRenderMode = 'symbol';
                const legendItems = paint.legendItems;
                const legendAttribute = paint.legendAttribute;
                const defaultFill = paint.defaultFillColor;
                const defaultStroke = paint.defaultStrokeColor;

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
                        'icon-size': ['/', paint.pointRadiusExpression, 32],
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                    },
                    paint: {
                        'icon-opacity': paint.iconOpacityExpression
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
                        'circle-radius': paint.pointRadiusExpression,
                        'circle-color': paint.fillColorExpression, // Color dinámico desde 'Fill'
                        'circle-stroke-width': paint.pointStrokeWidthExpression,
                        'circle-stroke-color': paint.strokeColorExpression, // Color dinámico desde 'Stroke'
                        'circle-opacity': paint.circleOpacityExpression
                    }
                });
            }
            
            return layers;
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
