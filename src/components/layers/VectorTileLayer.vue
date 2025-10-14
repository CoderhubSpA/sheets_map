<script>
import L from 'leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';

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
            isInitialized: false,
            // Referencias a handlers para poder limpiarlos
            leafletMouseMoveHandler: null,
            // Nombre del pane personalizado para esta capa
            customPaneName: null,
            // Flag para indicar si el estilo MapLibre ha sido cargado completamente
            styleLoaded: false
        };
    },
    mounted() {
        // Crear la capa cuando el componente se monta
        this.createVectorTileLayer();
    },
    beforeDestroy() {
        this.cleanup();
    },
    methods: {
        createVectorTileLayer() {
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
            
            // Extraer el nombre de la capa de la URL
            const urlParts = tileUrl.split('/');
            this.sourceLayer = urlParts[urlParts.length - 1].replace(/\{.*\}|\.pbf/g, '') || 'default';
            
            // Agregar parámetros {z}/{x}/{y} si no están presentes
            if (!tileUrl.includes('{z}') && !tileUrl.includes('{x}') && !tileUrl.includes('{y}')) {
                if (!tileUrl.endsWith('/')) {
                    tileUrl += '/';
                }
                tileUrl += '{z}/{x}/{y}.pbf';
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
                    ...this.createMapLibreLayers()
                ]
            };
            
            // Crear la capa MapLibre GL como capa de Leaflet
            this.vectorTileLayer = L.maplibreGL({
                style: maplibreStyle,
                attribution: this.layer.sh_map_has_layer_attribution || '',
                interactive: false,  // FALSE: Dejar que Leaflet maneje TODOS los eventos (evita patinado)
                pane: this.customPaneName,  // Usar el pane personalizado
                updateInterval: 16,  // Más frecuente para mejor sincronización (default: 32)
                padding: 0.1,  // Padding para evitar flickering en los bordes (default: 0.1)
                // Opciones de MapLibre GL para transparencia y rendering
                preserveDrawingBuffer: true,  // Preservar buffer para permitir transparencia
                antialias: true,  // Mejorar calidad del rendering
                fadeDuration: 0  // Desactivar fade para evitar problemas con múltiples capas
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
                `${this.layer.id}-line`
            ];
            
            // Agregar layer de puntos según si hay icono o no
            if (this.layer.sh_map_has_layer_point_image) {
                layerIds.push(`${this.layer.id}-symbol`);
            } else {
                layerIds.push(`${this.layer.id}-circle`);
            }
            
            // Consultar features en el punto clickeado
            const features = this.maplibreMap.queryRenderedFeatures(maplibrePoint, {
                layers: layerIds
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
                    `${self.layer.id}-line`,
                    self.layer.sh_map_has_layer_point_image ? `${self.layer.id}-symbol` : `${self.layer.id}-circle`
                ];
                
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
            
            const iconUrl = this.base_url + this.layer.sh_map_has_layer_point_image;
            const iconId = `${this.layer.id}-icon`;
            
            // Esperar a que MapLibre esté listo
            this.maplibreMap.on('load', () => {
                // Cargar imagen
                this.maplibreMap.loadImage(iconUrl, (error, image) => {
                    if (error) {
                        console.error('VectorTileLayer: Error cargando icono', iconUrl, error);
                        return;
                    }
                    
                    // Verificar si ya existe
                    if (!this.maplibreMap.hasImage(iconId)) {
                        this.maplibreMap.addImage(iconId, image);
                    }
                });
            });
        },
        
        createMapLibreLayers() {
            const layers = [];
            const fillColor = this.layer.sh_map_has_layer_text_color || this.layer.sh_map_has_layer_color || '#3388ff';
            const strokeColor = this.layer.sh_map_has_layer_color || '#3388ff';
            
            // Capa para polígonos
            layers.push({
                id: `${this.layer.id}-fill`,
                type: 'fill',
                source: 'vector-tiles',
                'source-layer': this.sourceLayer,
                filter: ['==', '$type', 'Polygon'],
                paint: {
                    'fill-color': fillColor,
                    'fill-opacity': 0.6
                }
            });
            
            // Capa para líneas
            layers.push({
                id: `${this.layer.id}-line`,
                type: 'line',
                source: 'vector-tiles',
                'source-layer': this.sourceLayer,
                filter: ['in', '$type', 'LineString', 'Polygon'],
                paint: {
                    'line-color': strokeColor,
                    'line-width': 2,
                    'line-opacity': 0.8
                }
            });
            
            // Capa para puntos: Usar icono personalizado SI existe, sino círculo
            if (this.layer.sh_map_has_layer_point_image) {
                // Layer tipo SYMBOL con icono personalizado
                layers.push({
                    id: `${this.layer.id}-symbol`,
                    type: 'symbol',
                    source: 'vector-tiles',
                    'source-layer': this.sourceLayer,
                    filter: ['==', '$type', 'Point'],
                    layout: {
                        'icon-image': `${this.layer.id}-icon`,
                        'icon-size': 0.8,
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': false
                    }
                });
            } else {
                // Layer tipo CIRCLE (sin icono)
                layers.push({
                    id: `${this.layer.id}-circle`,
                    type: 'circle',
                    source: 'vector-tiles',
                    'source-layer': this.sourceLayer,
                    filter: ['==', '$type', 'Point'],
                    paint: {
                        'circle-radius': 8,
                        'circle-color': strokeColor,
                        'circle-stroke-width': 3,
                        'circle-stroke-color': '#ffffff',
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
            console.log(`VectorTileLayer: Destruyendo capa ${this.layer.id}`);
            
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
            this.isInitialized = false;
        }
    }
};
</script>