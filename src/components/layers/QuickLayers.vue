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
        customStyles: {
            type: String,
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
        css_vars() {
            let customStyles;

            try {
                customStyles = JSON.parse(this.customStyles);
            } catch (e) {
                customStyles = {};
            }

            return {
                "--global-radius": customStyles["global-radius"] || "8px",
                "--subgroup-accordion-color":
                    customStyles["subgroup-accordion-color"] || "#044617",
                "--subgroup-accordion-active-color":
                    customStyles["subgroup-accordion-active-color"] ||
                    "#46845C",
                "--subgroup-accordion-text-color":
                    customStyles["subgroup-accordion-text-color"] || "#FFFFFF",
                "--subgroup-checkbox-background":
                    customStyles["subgroup-checkbox-background"] ||
                    "transparent",
                "--subgroup-checkbox-border-color":
                    customStyles["subgroup-checkbox-border-color"] ||
                    "#f7f7f7t",
                "--subgroup-checkbox-border-radius":
                    customStyles["subgroup-checkbox-border-radius"] || "8px",
                "--option-color": customStyles["option-color"] || "#001D09",
                "--option-active-color":
                    customStyles["option-active-color"] || "#7EF0A6",
                "--scrollbar-color":
                    customStyles["scrollbar-color"] || "#7EF0A6",
                "--scrollbar-color-hover":
                    customStyles["scrollbar-color-hover"] || "#17935BA7",
                "--button-color": customStyles["button-color"] || "#6a6a6a22",
                "--button-hover-color":
                    customStyles["button-hover-color"] || "#044617",
                "--button-text-color":
                    customStyles["button-text-color"] || "#FFFFFF",
                "--link-color": customStyles["link-color"] || "#7EF0A6",
                "--tooltip-text-color":
                    customStyles["tooltip-text-color"] || "white",
            };
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
    position: absolute;
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
                    background-color: var(--button-color);
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
                        background-color: var(--button-color);
                        transition-duration: 0s;
                    }

                    &:checked {
                        background-color: var(--button-hover-color);
                    }

                    &:checked {
                        &:after {
                            background-color: #fff;
                            left: 13px;
                        }
                    }
                    &:checked {
                        &:hover {
                            background-color: var(--button-hover-color);
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
                        color: var(--button-hover-color);
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
        top: 8%;
        left: 7%;
        overflow-y: visible;
    }
}
</style>
