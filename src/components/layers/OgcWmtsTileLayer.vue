<template>
    <div style="display: none;"></div>
</template>

<script>
import L from 'leaflet';
import { wmtsTileUrl } from '../../utils/ogcWmts';

// Capa de teselas WMTS: la URL de cada tesela sale de la configuración resuelta desde GetCapabilities.
const WmtsTileLayer = L.TileLayer.extend({
    getTileUrl(coords) {
        return wmtsTileUrl(this.options.wmts, coords);
    },
});

export default {
    name: 'OgcWmtsTileLayer',
    props: {
        map: {
            type: Object,
            default: null,
        },
        config: {
            type: Object,
            required: true,
        },
        opacity: {
            type: Number,
            default: 1,
        },
        options: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return { tileLayer: null };
    },
    watch: {
        map(_newMap, oldMap) {
            this.unmountLayer(oldMap);
            this.mountLayer();
        },
        config() {
            this.mountLayer();
        },
        opacity(value) {
            this.tileLayer?.setOpacity?.(value);
        },
    },
    mounted() {
        this.mountLayer();
    },
    beforeDestroy() {
        this.unmountLayer();
    },
    methods: {
        mountLayer() {
            this.unmountLayer();
            if (!this.map || !this.config) return;

            this.tileLayer = new WmtsTileLayer('', {
                ...this.options,
                wmts: this.config,
                minNativeZoom: this.config.minNativeZoom,
                maxNativeZoom: this.config.maxNativeZoom,
                opacity: this.opacity,
            });
            this.tileLayer.addTo(this.map);
        },
        unmountLayer(map = this.map) {
            if (!this.tileLayer) return;
            if (map?.hasLayer?.(this.tileLayer)) map.removeLayer(this.tileLayer);
            this.tileLayer = null;
        },
    },
};
</script>
