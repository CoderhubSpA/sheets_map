<template>
    <!-- Este componente NO renderiza nada en el DOM -->
    <!-- Solo maneja la capa de MapLibre y emite eventos -->
    <div style="display: none;"></div>
</template>

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
        visible: {
            type: Boolean,
            default: true
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
            isInitialized: false
        };
    },
    watch: {
        visible(newValue) {
            if (newValue) {
                this.addLayer();
            } else {
                this.removeLayer();
            }
        }
    },
    mounted() {
        if (this.visible) {
            this.createVectorTileLayer();
        }
    },
    beforeDestroy() {
        this.cleanup();
    },
    methods: {
        createVectorTileLayer() {
            // Verificar que MapLibre GL Leaflet esté disponible
            if (!L.maplibreGL) {
                console.error('VectorTileLayer: L.maplibreGL no está disponible');
                return;
            }

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
                layers: this.createMapLibreLayers()
            };
            
            // Crear la capa MapLibre GL como capa de Leaflet
            this.vectorTileLayer = L.maplibreGL({
                style: maplibreStyle,
                attribution: this.layer.sh_map_has_layer_attribution || '',
                interactive: true,
                pane: 'overlayPane',
                updateInterval: 32
            });
            
            // Agregar la capa al mapa
            this.vectorTileLayer.addTo(this.map);
            
            // Obtener MapLibre GL map instance
            this.maplibreMap = this.vectorTileLayer.getMaplibreMap();
            
            // Si hay icono personalizado, cargarlo
            if (this.layer.sh_map_has_layer_point_image) {
                this.loadCustomIcon();
            }
            
            // Configurar sincronización y eventos
            this.setupMapSync();
            this.setupMapLibreEvents();
            
            this.isInitialized = true;
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
        
        setupMapSync() {
            if (!this.maplibreMap || !this.map) return;
            
            // Sincronización entre Leaflet y MapLibre GL
            this.map.on('move', () => {
                if (this.maplibreMap && !this.maplibreMap._moving) {
                    const center = this.map.getCenter();
                    const zoom = this.map.getZoom();
                    
                    requestAnimationFrame(() => {
                        const mlCenter = this.maplibreMap.getCenter();
                        const mlZoom = this.maplibreMap.getZoom();
                        
                        const centerDiff = Math.abs(mlCenter.lat - center.lat) + Math.abs(mlCenter.lng - center.lng);
                        const zoomDiff = Math.abs(mlZoom - (zoom - 1));
                        
                        if (centerDiff > 0.0001 || zoomDiff > 0.1) {
                            this.maplibreMap._moving = true;
                            this.maplibreMap.jumpTo({
                                center: [center.lng, center.lat],
                                zoom: zoom - 1
                            });
                            setTimeout(() => { this.maplibreMap._moving = false; }, 100);
                        }
                    });
                }
            });
        },
        
        setupMapLibreEvents() {
            if (!this.maplibreMap) return;
            
            const self = this;
            
            // Evento de carga - solo para debugging inicial si es necesario
            // this.maplibreMap.once('load', function() {
            //     self.debugVectorTiles();
            // });
            
            // Errores
            this.maplibreMap.on('error', function(e) {
                console.error('VectorTileLayer MapLibre Error:', e.error);
            });
            
            // Eventos de mouse para cambiar cursor
            const layerIds = [
                `${this.layer.id}-fill`,
                `${this.layer.id}-line`,
                `${this.layer.id}-circle`
            ];
            
            this.maplibreMap.on('mouseenter', layerIds, function() {
                self.maplibreMap.getCanvas().style.cursor = 'pointer';
            });
            
            this.maplibreMap.on('mouseleave', layerIds, function() {
                self.maplibreMap.getCanvas().style.cursor = '';
            });
            
            // Evento de click
            this.maplibreMap.on('click', function(e) {
                // Prevenir propagación a Leaflet
                if (e.originalEvent) {
                    e.originalEvent.stopPropagation();
                    e.originalEvent.preventDefault();
                }
                
                self.handleMapLibreClick(e);
            });
        },
        
        handleMapLibreClick(e) {
            if (!this.maplibreMap) return;
            
            // Crear lista de layers a consultar (incluye symbol si hay icono personalizado)
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
            
            const features = this.maplibreMap.queryRenderedFeatures(e.point, {
                layers: layerIds
            });
            
            if (features.length > 0) {
                const feature = features[0];
                const properties = feature.properties;
                
                // Crear y mostrar el popup directamente aquí
                this.showPopup(properties, [e.lngLat.lat, e.lngLat.lng]);
                
                // Emitir evento para que el padre pueda reaccionar si necesita
                this.$emit('feature-click', {
                    layer: this.layer,
                    feature: feature,
                    properties: properties,
                    latlng: [e.lngLat.lat, e.lngLat.lng]
                });
            }
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
        
        addLayer() {
            if (this.vectorTileLayer && this.map && !this.map.hasLayer(this.vectorTileLayer)) {
                this.vectorTileLayer.addTo(this.map);
            }
        },
        
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
            
            // Limpiar eventos de MapLibre GL
            if (this.maplibreMap) {
                try {
                    this.maplibreMap.off('click');
                    this.maplibreMap.off('mouseenter');
                    this.maplibreMap.off('mouseleave');
                    this.maplibreMap.off('error');
                } catch (e) {
                    console.error('VectorTileLayer: Error limpiando eventos MapLibre', e);
                }
            }
            
            // Remover capa del mapa
            this.removeLayer();
            
            this.vectorTileLayer = null;
            this.maplibreMap = null;
            this.isInitialized = false;
        }
    }
};
</script>

<style scoped>
/* Este componente no tiene estilos propios */
/* Los estilos de popup y canvas están en SheetsMap.vue */
</style>
