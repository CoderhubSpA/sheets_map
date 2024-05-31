<template>
    <div :class="[{ 'quick-layers-scroll-bar': countQuickLayer > 3}, 'quick-layers']" :style="css_vars">
        <!-- <div class="quick-layers-title">
            <h5>Capas rápidas</h5>
        </div> -->
        <div class="quick-layers-content">
            <div
                class="quick-layers-content-item"
                v-for="layer in quickLayer"
                :key="layer.key"
            >
                <div class="quick-layer-item" :title="layer.value">
                    <input
                        type="checkbox"
                        class="quick-layer-input"
                        :id="'quick-layer-' + layer.key"
                        :checked="layer.active"
                        :disabled="layer.disabled"
                        @change="toggleLayer(layer)"
                    />
                    <label class="quick-layer-text" :for="'quick-layer-' + layer.key">
                        {{ layer.value }}
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    name: "QuickLayers",
    props: {
        layers: {
            type: Array,
            required: true,
        },
        css_vars: {
            type: Object,
            required: false,
        },
    },
    data() {
        return {
            active_layers: {},
            active_base_layers: '',
        };
    },
    computed: {
        quickLayer() {
            return this.layers.filter(
                (layer) => layer.quickLayer == 1
            );
        },
        countQuickLayer() {
            return this.quickLayer.length;
        },
    },
    methods: {
        toggleLayer(layer) {
            layer.timestamp = new Date().getTime();

            this.$emit("set-layer", layer);
        },
    },
};
</script>

<style lang="scss">
.quick-layers {
    position: relative;
    top: -0.1%;
    width: 420px;
    height: 66px;
    margin: 10px;
    padding: 10px;
    z-index: 999;
    overflow: hidden;
    border-radius: 5px;

    &.disabled-quick-layer {
        pointer-events: none;
        opacity: 0.4; /* Optional: Add some visual cue that element is disabled */
    }

    &.quick-layers-scroll-bar {
        overflow-y: scroll;
        background-color: transparent;
        box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
    }

    .quick-layers-content {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
        width: 100%;

        .quick-layers-content-item {
            height: 52px;
            overflow-y: hidden;
            margin: 0px 4px;

            .quick-layer-item {
                display: flex;
                align-items: center;
                margin: 4px 0px 8px 0px;
                padding: 8px;
                overflow-x: hidden;
                background-color: #fff;
                border-radius: 8px;
                width: 115px;
                overflow-y: hidden;

                input[type="checkbox"] {
                    cursor: default;
                }

                .quick-layer-input {
                    appearance: none;
                    transition: background-color 400ms ease-out;
                    background-color: #e0e0e0;
                    border-radius: 72px;
                    border-style: none;
                    flex-shrink: 0;
                    height: 20px;
                    margin: 0;
                    position: relative;
                    width: 30px;

                    &:before {
                        content: "";
                        position: absolute;
                        bottom: -6px;
                        left: -6px;
                        right: -6px;
                        top: -6px;
                    }

                    &:after {
                        content: "";
                        width: 14px;
                        height: 14px;
                        position: absolute;
                        left: 3px;
                        top: 3px;
                        background-color: #fff;
                        border-radius: 50%;
                        transition: all 100ms ease-out;
                    }

                    &:hover {
                        background-color: #9e9e9e;
                        transition-duration: 0s;
                    }

                    &:checked {
                        background-color: var(--sh-map-marker-pop-up-title-color);
                    }

                    &:checked {
                        &:after {
                            background-color: #fff;
                            left: 13px;
                        }
                    }
                    &:checked {
                        &:hover {
                            background-color: var(--sh-map-marker-pop-up-title-color)
                        }
                    }
                }
                .quick-layer-text {
                    height: 24px;
                    overflow: hidden;
                    margin-bottom: 0;
                    margin-left: 4px;
                    color: #999999;
                    font-size: 1rem;

                    &.active {
                        color: var(--sh-map-marker-pop-up-title-color);
                    }
                }

                &:focus:not(.focus-visible) {
                    outline: 0;
                }
            }
        }
    }

    @media screen and (max-width: 768px){
        width: 80%;
        top: 0;
        left: 7%;
        overflow-y: visible;
        height: auto;
    }
}
</style>
