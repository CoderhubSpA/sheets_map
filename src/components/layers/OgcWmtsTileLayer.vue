<template>
    <div style="display: none;"></div>
</template>

<script>
import L from 'leaflet';
import { wmtsTileUrl } from '../../utils/ogcWmts';
import { watchTileLoad } from '../../utils/tileLoadStatus';

// Capa de teselas WMTS: la URL de cada tesela sale de la configuración resuelta desde GetCapabilities.
const WmtsTileLayer = L.TileLayer.extend({
    getTileUrl(coords) {
        return wmtsTileUrl(this.options.wmts, coords);
    },

    createTile(coords, done) {
        // Una tesela que el servicio no tiene (nivel o límites) se deja vacía, sin pedirla.
        if (!this.getTileUrl(coords)) {
            const tile = document.createElement('div');
            setTimeout(() => done(null, tile), 0);
            return tile;
        }
        return L.TileLayer.prototype.createTile.call(this, coords, done);
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
        return { tileLayer: null, stopWatchingTiles: null };
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
            // Antes de agregarla al mapa, para no perder el inicio de la primera carga.
            this.stopWatchingTiles = watchTileLoad(this.tileLayer, (status) => this.$emit('tile-status', status));
            this.tileLayer.addTo(this.map);
        },
        unmountLayer(map = this.map) {
            this.stopWatchingTiles?.();
            this.stopWatchingTiles = null;
            if (!this.tileLayer) return;
            if (map?.hasLayer?.(this.tileLayer)) map.removeLayer(this.tileLayer);
            this.tileLayer = null;
        },
    },
};
</script>
