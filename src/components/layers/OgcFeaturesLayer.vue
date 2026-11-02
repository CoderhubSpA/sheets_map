<template>
    <div style="display: none;"></div>
</template>

<script>
import L from 'leaflet';
import { crs84Bbox, fetchFeaturesInView } from '../../utils/ogcApiFeatures';
import { fetchWfsFeaturesInView } from '../../utils/ogcWfs';

// Espera tras mover el mapa antes de pedir los elementos de la nueva vista.
const MOVE_DEBOUNCE_MS = 400;

export default {
    name: 'OgcFeaturesLayer',
    props: {
        map: {
            type: Object,
            default: null,
        },
        layer: {
            type: Object,
            required: true,
        },
        // Origen de los elementos: `{ key, kind: 'api-features', itemsUrl }` o `{ key, kind: 'wfs', config }`.
        source: {
            type: Object,
            required: true,
        },
        color: {
            type: String,
            default: '#0074bd',
        },
        opacity: {
            type: Number,
            default: 1,
        },
    },
    data() {
        return { geoJsonLayer: null, controller: null, timer: null };
    },
    watch: {
        map(_newMap, oldMap) {
            this.unmountLayer(oldMap);
            this.mountLayer();
        },
        'source.key'() {
            this.mountLayer();
        },
        color() {
            this.restyle();
        },
        opacity() {
            this.restyle();
        },
    },
    mounted() {
        this.mountLayer();
    },
    beforeDestroy() {
        this.unmountLayer();
    },
    methods: {
        featureStyle() {
            return {
                color: this.color,
                weight: 2,
                opacity: this.opacity,
                fillColor: this.color,
                fillOpacity: 0.3 * this.opacity,
            };
        },
        mountLayer() {
            this.unmountLayer();
            if (!this.map || !this.source?.key) return;

            this.geoJsonLayer = L.geoJSON(null, {
                style: () => this.featureStyle(),
                pointToLayer: (_feature, latlng) => L.circleMarker(latlng, { ...this.featureStyle(), radius: 6 }),
                onEachFeature: (feature, featureLayer) => {
                    featureLayer.on('click', (event) => this.$emit('feature-click', {
                        layer: this.layer,
                        properties: feature.properties || {},
                        latlng: event.latlng,
                    }));
                },
            }).addTo(this.map);
            this.map.on('moveend', this.scheduleLoad);
            this.load();
        },
        unmountLayer(map = this.map) {
            clearTimeout(this.timer);
            this.controller?.abort();
            this.controller = null;
            map?.off?.('moveend', this.scheduleLoad);
            if (this.geoJsonLayer && map?.hasLayer?.(this.geoJsonLayer)) map.removeLayer(this.geoJsonLayer);
            this.geoJsonLayer = null;
        },
        scheduleLoad() {
            clearTimeout(this.timer);
            this.timer = setTimeout(this.load, MOVE_DEBOUNCE_MS);
        },
        async load() {
            if (!this.map || !this.geoJsonLayer) return;
            // Cancela la petición de la vista anterior.
            this.controller?.abort();
            const controller = new AbortController();
            this.controller = controller;
            const bounds = this.map.getBounds();
            const view = {
                west: bounds.getWest(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                north: bounds.getNorth(),
            };
            this.$emit('status', { layerId: this.layer.id, loading: true });

            try {
                const result = this.source.kind === 'wfs'
                    ? await fetchWfsFeaturesInView({ config: this.source.config, view, signal: controller.signal })
                    : await fetchFeaturesInView({ itemsUrl: this.source.itemsUrl, bbox: crs84Bbox(view), signal: controller.signal });
                if (controller !== this.controller || !this.geoJsonLayer) return;
                this.geoJsonLayer.clearLayers();
                this.geoJsonLayer.addData({ type: 'FeatureCollection', features: result.features });
                this.$emit('status', {
                    layerId: this.layer.id,
                    loading: false,
                    count: result.features.length,
                    numberMatched: result.numberMatched,
                    truncated: result.truncated,
                });
            } catch (error) {
                // Una petición cancelada por otra más nueva o al desmontar no es un error.
                if (controller !== this.controller) return;
                this.$emit('status', {
                    layerId: this.layer.id,
                    loading: false,
                    error: error?.message || 'No fue posible cargar los elementos del servicio.',
                });
            }
        },
        restyle() {
            this.geoJsonLayer?.setStyle?.(this.featureStyle());
        },
    },
};
</script>
