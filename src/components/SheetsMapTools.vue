<template>
    <div class="layers-dropdown" ref="dropdown" :style="css_vars">
        <b-dropdown
            id="dropdown_base_layers"
            menu-class="layers-dropdown-menu"
            dropleft
        >
            <template #button-content>
                <b-icon icon="layers-half" aria-hidden="false"></b-icon>
            </template>

            <h5>Capas Analíticas</h5>
            <b-dropdown-item
                @click.native.capture.stop="getOption(option)"
                v-for="option in analytical_layer"
                :key="option.key"
                :value="option.value"
                href="#"
                :class="{
                    'layer-option-active': option.active,
                }"
            >
                <div
                    class="layer-option"
                    :style="{
                        backgroundImage: `url(${base_url}${option.image})`,
                    }"
                >
                    <div class="layer-option-body">
                        <span>{{ option.value }}</span>
                    </div>
                </div>
            </b-dropdown-item>

            <h5>Capas Base</h5>
            <b-dropdown-item
                @click.native.capture.stop="getOption(option)"
                v-for="option in base_layers"
                :key="option.key"
                :value="option.value"
                :class="{
                    'layer-option-active': option.active,
                }"
            >
                <div
                    class="layer-option"
                    :style="{
                        backgroundImage: `url(${base_url}${option.image})`,
                    }"
                >
                    <div class="layer-option-body">
                        <span>{{ option.value }}</span>
                    </div>
                </div>
            </b-dropdown-item>

            <h5>Capas Operativas</h5>
            <div class="layer-group">
                <b-dropdown-item
                    @click.native.capture.stop="getOption(option)"
                    v-for="option in operational_layer"
                    :key="option.key"
                    :value="option.value"
                    href="#"
                    :class="{
                        'layer-option-active': option.active,
                    }"
                >
                    <div class="layer-option layer-option-grouped">
                        <div class="layer-option-body">
                            <div class="layer-image-container">
                                <img
                                    v-if="option.image"
                                    :src="`${base_url}${option.image}`"
                                    alt=""
                                />
                            </div>
                            <span>{{ option.value }}</span>
                        </div>
                    </div>
                </b-dropdown-item>
            </div>
        </b-dropdown>
    </div>
</template>
<script>
import _ from "lodash";
import Vue from "vue";
import {
    BootstrapVue,
    BootstrapVueIcons,
} from "bootstrap-vue/dist/bootstrap-vue.esm";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "bootstrap/dist/css/bootstrap.css";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

export default {
    props: {
        // Propiedades de componentes
        id: String,
        entity_type_id: String,
        config_entity_id: String,
        config_entity_type_id: String,
        endpoint_config: String,
        code: String,
        base_url: String,
        active_filters: Array,
        info: Object,
        data: Object,
        layers: Object, // Todas las capas
        custom_styles: String,
        data_pivots: {
            type: Object,
            default: () => {},
        },
        all_info: {
            type: Object,
            default: () => {},
        },
    },
    data() {
        return {
            data_tools: [],
            data_tools_id: "",
            base_layer: {},
            base_layers: [],
            operational_layer: [],
            analytical_layer: [],
        };
    },
    computed: {
        parsed_layers() {
            let parsed_layers = [];
            if (!_.isEmpty(this.layers)) {
                parsed_layers = this.parseData();
            }
            return parsed_layers;
        },
        css_vars() {
            let custom_styles = JSON.parse(this.custom_styles) || {};

            return {
                "--radius-multiplier": custom_styles["radius-multiplier"] || "8px",
                "--option-color": custom_styles["option-color"] || "#001D09",
                "--border-color": custom_styles["border-color"] || "#7EF0A6",
                "--menu-bg-color": custom_styles["menu-bg-color"] || "#343B30AA",
            };
        },
    },
    watch: {
        parsed_layers: {
            handler() {
                if (Array.isArray(this.parsed_layers)) {
                    this.base_layers = this.parsed_layers.filter(
                        (item) => item.type == "base"
                    );
                    this.operational_layer = this.parsed_layers.filter(
                        (item) => item.type == "operative"
                    );
                    this.analytical_layer = this.parsed_layers.filter(
                        (item) => item.type == "analytic"
                    );
                    // Elegimos la primera si existe y si no se ha seleccionado alguna capa
                    if (
                        _.isEmpty(this.base_layer) &&
                        _.first(this.base_layers)
                    ) {
                        this.base_layer = _.first(this.base_layers) || {};
                        this.base_layer.active = true;
                    }
                }
            },
            deep: true,
        },
    },
    mounted() {
        // ...
    },
    methods: {
        getOption(option) {
            let option_active_val = option.active;
            switch (option.type) {
                case "base":
                    // La capa base solo debe tener una activa
                    if (this.base_layer.key == option.key) {
                        option.active = !option_active_val;
                        this.base_layer = {};
                    } else {
                        if (_.isEmpty(this.base_layer)) {
                            option.active = !option_active_val;
                            this.base_layer = option;
                        } else if (this.base_layer.key !== option.key) {
                            let cb = this.base_layers.find(
                                (elem) => elem.key == this.base_layer.key
                            );
                            cb.active = option_active_val;
                            option.active = !option_active_val;
                            this.base_layer = option;
                        }
                    }
                    break;
                case "analytic":
                    option.active = !option_active_val;
                    break;
                case "operative":
                    option.active = !option_active_val;
                    break;
            }
        },
        parseData() {
            let parsed_layers_result = Object.values(this.layers).map(
                (layer) => {
                    return {
                        key: layer.id,
                        type: layer["sh_map_has_layer_type"],
                        image: layer["sh_map_has_layer_image"],
                        value: layer.name,
                        active: false, // la capa esta desactiva por default
                    };
                }
            );

            return parsed_layers_result;
        },
    },
};
</script>

<style>
.layers-dropdown .dropdown-toggle {
    border: none;
    background-color: white;
    color: #000000 !important;
}
.layers-dropdown h5 {
    font-size: 0.75rem;
    color: var(--border-color);
    margin-top: 15px;
}
.layers-dropdown .dropdown-item {
    padding: 0;
    margin-top: 0.5rem;
}
.layers-dropdown .dropdown-item:hover,
.layers-dropdown .dropdown-item:focus {
    background-color: transparent;
}
.layers-dropdown .layers-dropdown-menu {
    background-color: var(--menu-bg-color);
    overflow: auto;
    border-radius: var(--radius-multiplier);
    padding: 1.25rem;
    max-height: 80vh;
    min-width: 272px;
}
.layers-dropdown .layer-option {
    background-size: cover;
    border-radius: var(--radius-multiplier);
    overflow: hidden;
    height: 72px;
}
.layers-dropdown .layer-option .layer-option-body {
    background: linear-gradient(transparent 20%, var(--option-color) 92%);
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: end;
    padding: 0.3rem;
    color: white;
    font-size: 0.75rem;
    transition: all 0.4s ease;
}
.layers-dropdown .layer-option .layer-option-body span {
    max-width: 100%;
    white-space: pre-wrap;
    text-align: center;
}
.layers-dropdown .layer-option:hover .layer-option-body {
    background: linear-gradient(transparent 20%, #044617 92%);
}
.layers-dropdown .layer-option-active .layer-option {
    border: 3px #000000;
    border: 2px solid var(--border-color);
}
.layer-group {
    display: flex;
    max-width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
}
.layer-group li {
    max-width: 31%;
    width: 31%;
}
.layers-dropdown .layer-option-grouped {
    background-color: var(--option-color);
}
.layers-dropdown .layer-option-grouped .layer-option-body {
    justify-content: space-around;
    flex-flow: column;
    align-items: center;
    font-size: 0.6rem;
}
.layers-dropdown .layer-option-grouped .layer-image-container {
    display: flex;
    justify-content: center;
}
.layers-dropdown .layer-option-grouped .layer-image-container img {
    height: 90%;
    width: auto;
    max-width: 100%;
}
.layers-dropdown .layer-option-active .layer-option-grouped {
    background-color: var(--option-color);
}
</style>
