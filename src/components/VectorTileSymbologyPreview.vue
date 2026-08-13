<template>
    <aside class="symbology-preview" aria-label="Vista previa de simbología y leyenda">
        <div class="symbology-preview__header">
            <div>
                <span class="symbology-preview__eyebrow">Vista previa</span>
                <h6>Resultado cartográfico</h6>
            </div>
            <span class="symbology-preview__geometry">{{ geometryLabel }}</span>
        </div>

        <div class="symbology-preview__map-frame">
            <div
                ref="mapContainer"
                class="symbology-preview__map"
                role="img"
                :aria-label="`Vista previa de un sector de la capa ${previewLayer.name}`"
            ></div>
            <div v-if="!mapLoaded && !mapError" class="symbology-preview__map-state" role="status">
                <span class="symbology-preview__spinner" aria-hidden="true"></span>
                Cargando un sector de la capa…
            </div>
            <div v-if="mapError" class="symbology-preview__map-state symbology-preview__map-state--error" role="alert">
                {{ mapError }}
            </div>
        </div>

        <div class="symbology-preview__legend-area">
            <div v-if="!draft.showInMapLegend" class="symbology-preview__empty">
                La leyenda está oculta en el mapa.
            </div>
            <vector-tile-legend
                v-else-if="previewLegend"
                :layer="previewLayer"
                :legend="previewLegend"
            />
            <div v-else class="symbology-preview__empty">
                Selecciona un atributo para construir la leyenda.
            </div>
        </div>

    </aside>
</template>

<script>
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import VectorTileLegend from './layers/VectorTileLegend.vue'
import {
    buildVectorTilePreviewLayers,
    buildVectorTilePreviewRenderState,
    normalizeVectorTileSpatialContext,
    VECTOR_TILE_PREVIEW_SOURCE_ID,
} from '../utils/vectorTileLegend/preview.js'
import { buildVectorTileTemplateUrl } from '../utils/vectorTileUrl.js'
import { parsePointShapeImageId } from '../utils/vectorTileLegend/icon.js'
import { normalizePointCanvasStrokeWidth, pointCanvasDashPattern } from '../utils/vectorTileLegend/canvas.js'

const INITIAL_CENTER = [-71.1, -35.1]
const INITIAL_ZOOM = 9
const CHILE_BOUNDS = [[-76.5, -56.5], [-65, -17]]

export default {
    name: 'VectorTileSymbologyPreview',
    components: { VectorTileLegend },
    props: {
        draft: { type: Object, required: true },
        layer: { type: Object, required: true },
        semanticLegend: { type: Object, default: null },
        spatialContext: { type: Object, default: () => ({ bbox: null, centroid: null }) },
    },
    data() {
        return {
            map: null,
            mapLoaded: false,
            mapError: '',
            autoFitted: false,
            styleUpdateFrame: null,
            resizeObserver: null,
        }
    },
    computed: {
        geometryType() { return String(this.draft.geometryType || '').toLowerCase() },
        geometryLabel() {
            if (this.geometryType.includes('polygon')) return 'Polígono'
            if (this.geometryType.includes('line')) return 'Línea'
            if (this.geometryType.includes('point')) return 'Punto'
            return 'Geometría'
        },
        tileUrl() {
            return buildVectorTileTemplateUrl(this.layer.url || this.layer.sh_map_has_layer_url || '')
        },
        sourceLayer() { return this.draft.layerName || this.layer.sh_map_has_layer_geoserver_layer || 'default' },
        renderState() {
            return buildVectorTilePreviewRenderState(this.draft, this.layer, this.semanticLegend)
        },
        viewport() {
            return normalizeVectorTileSpatialContext(this.spatialContext, this.semanticLegend)
        },
        viewportKey() {
            return JSON.stringify(this.viewport)
        },
        previewLegend() { return this.renderState?.legend || null },
        previewLayer() {
            return {
                ...this.layer,
                id: `${this.layer.id || this.sourceLayer}-preview`,
                name: this.draft.title || this.layer.value || this.layer.name || this.sourceLayer,
            }
        },
    },
    watch: {
        draft: {
            deep: true,
            handler() { this.scheduleLiveStyle() },
        },
        semanticLegend: {
            deep: true,
            handler() { this.scheduleLiveStyle() },
        },
        tileUrl() { this.recreateMap() },
        sourceLayer() { this.recreateMap() },
        viewportKey() { this.$nextTick(this.fitToSpatialContext) },
    },
    mounted() {
        this.$nextTick(this.initializeMap)
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.map?.resize())
            this.resizeObserver.observe(this.$el)
        }
    },
    beforeDestroy() {
        this.resizeObserver?.disconnect()
        if (this.styleUpdateFrame !== null) window.cancelAnimationFrame(this.styleUpdateFrame)
        this.destroyMap()
    },
    methods: {
        initializeMap() {
            if (!this.$refs.mapContainer || !this.tileUrl || !this.sourceLayer) {
                this.mapError = 'No fue posible determinar el servicio vectorial de la capa.'
                return
            }

            this.mapError = ''
            this.mapLoaded = false
            this.autoFitted = false
            const layers = buildVectorTilePreviewLayers(this.sourceLayer, this.renderState.styleExpressions)
            this.map = new maplibregl.Map({
                container: this.$refs.mapContainer,
                center: this.viewport.centroid || INITIAL_CENTER,
                zoom: INITIAL_ZOOM,
                minZoom: 3,
                maxZoom: 14,
                maxBounds: CHILE_BOUNDS,
                maxTileCacheSize: 6,
                renderWorldCopies: false,
                fadeDuration: 0,
                dragRotate: false,
                pitchWithRotate: false,
                scrollZoom: false,
                boxZoom: false,
                keyboard: false,
                attributionControl: false,
                style: {
                    version: 8,
                    sources: {
                        'preview-basemap': {
                            type: 'raster',
                            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                            tileSize: 256,
                            attribution: '© OpenStreetMap contributors',
                        },
                        [VECTOR_TILE_PREVIEW_SOURCE_ID]: {
                            type: 'vector',
                            tiles: [this.tileUrl],
                            scheme: 'xyz',
                            minzoom: 0,
                            maxzoom: 22,
                        },
                    },
                    layers: [
                        { id: 'preview-background', type: 'background', paint: { 'background-color': '#eef3f7' } },
                        { id: 'preview-basemap', type: 'raster', source: 'preview-basemap' },
                        ...layers,
                    ],
                },
            })
            this.map.on('styleimagemissing', this.handleMissingShapeImage)
            this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
            this.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
            const markStyleReady = () => {
                this.mapLoaded = true
                this.mapError = ''
                this.applyLiveStyle()
                this.fitToSpatialContext()
            }
            this.map.on('style.load', markStyleReady)
            this.map.on('load', markStyleReady)
            if (this.map.isStyleLoaded()) markStyleReady()
            this.map.on('idle', this.fitToLoadedSector)
            this.map.on('error', event => {
                if (event?.error) console.warn('VectorTileSymbologyPreview:', event.error)
            })
        },
        recreateMap() {
            this.$nextTick(() => {
                this.destroyMap()
                this.initializeMap()
            })
        },
        destroyMap() {
            if (!this.map) return
            this.map.off('idle', this.fitToLoadedSector)
            this.map.off('styleimagemissing', this.handleMissingShapeImage)
            this.map.remove()
            this.map = null
            this.mapLoaded = false
        },
        scheduleLiveStyle() {
            this.$nextTick(() => {
                if (this.styleUpdateFrame !== null) window.cancelAnimationFrame(this.styleUpdateFrame)
                this.styleUpdateFrame = window.requestAnimationFrame(() => {
                    this.styleUpdateFrame = null
                    this.applyLiveStyle()
                })
            })
        },
        applyLiveStyle() {
            // `isStyleLoaded()` también puede ser false mientras siguen llegando
            // tiles pesados. La definición del estilo ya está disponible desde
            // `style.load`, por lo que no se debe bloquear la edición en vivo.
            if (!this.map || !this.mapLoaded) return false
            // Construir el estado directamente con las props actuales evita que una
            // respuesta semántica y el draft reemplazado en el mismo ciclo reutilicen
            // un computed anterior de Vue 2.
            const liveRenderState = buildVectorTilePreviewRenderState(
                this.draft,
                this.layer,
                this.semanticLegend,
            )
            const nextLayers = buildVectorTilePreviewLayers(this.sourceLayer, liveRenderState.styleExpressions)
            nextLayers.forEach(layerDefinition => {
                if (!this.map.getLayer(layerDefinition.id)) return
                Object.entries(layerDefinition.paint || {}).forEach(([property, value]) => {
                    try {
                        this.map.setPaintProperty(layerDefinition.id, property, value)
                    } catch (error) {
                        console.warn(`VectorTileSymbologyPreview: no se pudo actualizar ${property}`, error)
                    }
                })
                Object.entries(layerDefinition.layout || {}).forEach(([property, value]) => {
                    try {
                        this.map.setLayoutProperty(layerDefinition.id, property, value)
                    } catch (error) {
                        console.warn(`VectorTileSymbologyPreview: no se pudo actualizar ${property}`, error)
                    }
                })
            })
            return true
        },
        handleMissingShapeImage(event) {
            const imageConfig = parsePointShapeImageId(event?.id)
            if (!imageConfig || !this.map || this.map.hasImage(event.id)) return
            this.generateColoredShapeImage(event.id, imageConfig)
        },
        generateColoredShapeImage(imageId, imageConfig) {
            const size = 128
            const strokeWidth = normalizePointCanvasStrokeWidth(imageConfig.strokeWidth)
            const scaledStrokeWidth = Math.round(strokeWidth * 2)
            const padding = scaledStrokeWidth + 2
            const canvas = document.createElement('canvas')
            canvas.width = size
            canvas.height = size
            const context = canvas.getContext('2d')
            if (!context) return
            const center = size / 2
            const radius = (size / 2) - padding

            context.beginPath()
            if (imageConfig.shape === 'square') {
                const side = radius * 1.6
                context.rect(center - side / 2, center - side / 2, side, side)
            } else if (imageConfig.shape === 'triangle') {
                context.moveTo(center, center - radius)
                context.lineTo(center + radius * 0.87, center + radius * 0.75)
                context.lineTo(center - radius * 0.87, center + radius * 0.75)
                context.closePath()
            } else if (imageConfig.shape === 'diamond') {
                const side = radius * 1.15
                context.save()
                context.translate(center, center)
                context.rotate(Math.PI / 4)
                context.rect(-side / 2, -side / 2, side, side)
                context.restore()
            } else {
                context.arc(center, center, radius, 0, Math.PI * 2)
            }

            context.fillStyle = imageConfig.fill
            context.fill()
            if (scaledStrokeWidth > 0) {
                context.strokeStyle = imageConfig.stroke
                context.lineWidth = scaledStrokeWidth
                context.lineJoin = 'miter'
                context.lineCap = imageConfig.dashStyle === 'dotted' ? 'round' : 'butt'
                context.setLineDash(pointCanvasDashPattern(imageConfig.dashStyle, 2))
                context.stroke()
            }
            const imageData = context.getImageData(0, 0, size, size)
            this.map.addImage(imageId, {
                width: size,
                height: size,
                data: new Uint8Array(imageData.data.buffer),
            })
        },
        fitToSpatialContext() {
            if (!this.map || !this.mapLoaded) return false
            const { bbox, centroid } = this.viewport
            if (centroid) this.map.setCenter(centroid)
            if (!bbox) {
                if (!centroid) return false
                this.autoFitted = true
                this.map.jumpTo({ center: centroid, zoom: INITIAL_ZOOM })
                return true
            }

            this.autoFitted = true
            const [minX, minY, maxX, maxY] = bbox
            if (minX === maxX && minY === maxY) {
                this.map.jumpTo({ center: centroid || [minX, minY], zoom: 11 })
                return true
            }
            this.map.fitBounds([[minX, minY], [maxX, maxY]], {
                padding: 28,
                maxZoom: 11,
                duration: 0,
            })
            return true
        },
        fitToLoadedSector() {
            if (!this.map || this.autoFitted) return
            if (this.fitToSpatialContext()) return
            let features = []
            try {
                features = this.map.querySourceFeatures(VECTOR_TILE_PREVIEW_SOURCE_ID, {
                    sourceLayer: this.sourceLayer,
                }).slice(0, 200)
            } catch (error) {
                return
            }
            if (!features.length) return

            const bounds = new maplibregl.LngLatBounds()
            const visit = coordinates => {
                if (!Array.isArray(coordinates)) return
                if (coordinates.length >= 2 && Number.isFinite(Number(coordinates[0])) && Number.isFinite(Number(coordinates[1]))) {
                    bounds.extend([Number(coordinates[0]), Number(coordinates[1])])
                    return
                }
                coordinates.forEach(visit)
            }
            features.forEach(feature => visit(feature.geometry?.coordinates))
            if (bounds.isEmpty()) return
            this.autoFitted = true
            this.map.fitBounds(bounds, { padding: 28, maxZoom: 11, duration: 0 })
        },
    },
}
</script>

<style scoped>
.symbology-preview { position: sticky; top: 0; align-self: start; border: 1px solid #d7e0e8; border-radius: 10px; background: #fff; box-shadow: 0 8px 24px rgba(22, 49, 75, .08); overflow: hidden; }
.symbology-preview__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border-bottom: 1px solid #e4eaf0; background: #f8fafc; }
.symbology-preview__header h6 { margin: 2px 0 0; color: #263746; font-size: 1rem; font-weight: 700; }
.symbology-preview__eyebrow { color: #5c6f82; font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.symbology-preview__geometry { padding: 4px 9px; border-radius: 999px; color: #0b5cad; background: #e8f2ff; font-size: .68rem; font-weight: 700; }
.symbology-preview__map-frame { position: relative; height: 230px; margin: 16px; border: 1px solid #cbd7e2; border-radius: 8px; overflow: hidden; background: #edf3f7; }
.symbology-preview__map { width: 100%; height: 100%; }
.symbology-preview__map :deep(.maplibregl-canvas-container), .symbology-preview__map :deep(.maplibregl-canvas) { position: absolute !important; inset: 0; }
.symbology-preview__map-state { position: absolute; inset: 0; z-index: 4; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 20px; color: #476174; background: rgba(244, 248, 251, .9); font-size: .76rem; text-align: center; }
.symbology-preview__map-state--error { color: #842029; background: rgba(248, 215, 218, .94); }
.symbology-preview__spinner { width: 16px; height: 16px; border: 2px solid #b9cee0; border-top-color: #1473c9; border-radius: 50%; animation: preview-spin .8s linear infinite; }
.symbology-preview__legend-area { max-height: 270px; margin: 0 16px 16px; overflow: auto; border-radius: 9px; scrollbar-width: thin; }
.symbology-preview__legend-area :deep(.vector-tile-legend) { box-sizing: border-box; width: 100%; max-width: 100%; box-shadow: none; }
.symbology-preview__empty { padding: 12px; border: 1px solid #dde5ec; border-radius: 8px; color: #667788; background: #f7f9fb; font-size: .78rem; }
.symbology-preview :deep(.maplibregl-ctrl-top-right) { top: 6px; right: 6px; }
.symbology-preview :deep(.maplibregl-ctrl-group button) { width: 26px; height: 26px; }
.symbology-preview :deep(.maplibregl-ctrl-attrib) { font-size: 9px; }
@keyframes preview-spin { to { transform: rotate(360deg); } }
@media (max-width: 1050px) { .symbology-preview { position: static; } .symbology-preview__map-frame { height: 280px; } }
@media (max-width: 600px) { .symbology-preview__map-frame { height: 220px; margin: 12px; } .symbology-preview__legend-area { margin: 0 12px 12px; } }
</style>
