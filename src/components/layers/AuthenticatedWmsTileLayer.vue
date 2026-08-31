<template>
    <div style="display: none;"></div>
</template>

<script>
import { createAuthenticatedWmsLayer } from '../../utils/authenticatedWmsLayer';

export default {
    name: 'AuthenticatedWmsTileLayer',
    props: {
        map: {
            type: Object,
            default: null,
        },
        baseUrl: {
            type: String,
            required: true,
        },
        layers: {
            type: String,
            required: true,
        },
        transparent: {
            type: Boolean,
            default: true,
        },
        format: {
            type: String,
            default: 'image/png',
        },
        opacity: {
            type: Number,
            default: 1,
        },
        options: {
            type: Object,
            default: () => ({}),
        },
        request_auth: {
            type: Object,
            default: null,
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
        baseUrl() {
            this.mountLayer();
        },
        layers() {
            this.mountLayer();
        },
        transparent() {
            this.mountLayer();
        },
        format() {
            this.mountLayer();
        },
        request_auth() {
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
            if (!this.map || !this.baseUrl || !this.layers) return;

            this.tileLayer = createAuthenticatedWmsLayer(this.baseUrl, {
                ...this.options,
                format: this.format,
                layers: this.layers,
                opacity: this.opacity,
                requestAuth: this.request_auth,
                transparent: this.transparent,
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
