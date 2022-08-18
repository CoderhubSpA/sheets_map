<template>
    <div class="layers-dropdown" ref="dropdown" :style="css_vars">
        <menu
            id="dropdown_base_layers"
            class="layers-menu"
        >
            <section v-for="(group, group_key) in grouped_layers"
                :key="group_key"
            >
                <h5>{{group_key}}</h5>
                <!-- Si no posee subgrupos -->
                <div v-for="(subgroup, subgroup_key) in group"
                    :key="subgroup_key"
                >
                    <div
                        v-if="subgroup_key == 'null'"
                        class="layer-group"
                    >
                        <div 
                            v-for="option in subgroup"
                            :key="option.key"
                            @click="toggleLayer(option)"
                            class="layer-option-wrapper"
                            :class="{
                                'active': option.active,
                            }"
                        >
                            <!-- Si existe mas de un subgrupo,
                                significa que debe tener un estilo distinto al estandar 
                            -->
                            <button v-if="Object.values(group).length > 1"
                                class="layer-option grouped"
                            >
                                <div class="layer-option-active-icon">
                                    <b-icon icon="dash-circle-fill" aria-hidden="false"></b-icon>
                                </div>
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
                            </button>
                            <!-- Si existe solo 1 subgrupo, debe tener un estilo
                            normal -->
                            <button
                                v-else
                                class="layer-option"
                                :style="{
                                    backgroundImage: `url(${base_url}${option.image})`,
                                }"
                            >
                                <div class="layer-option-active-icon">
                                    <b-icon icon="dash-circle-fill" ></b-icon>
                                </div>
                                <div class="layer-option-body">
                                    <span>{{ option.value }}</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div v-else 
                        class="layer-subgroup"
                    >
                        <!-- Para las capas subagrupadas
                        Se representan desde elementos colapsables -->
                        <fieldset class="collapsed">
                            <legend  @click="e => e.currentTarget.parentNode.classList.toggle('collapsed')">
                                {{subgroup_key}}
                                <b-icon
                                    icon="chevron-up"
                                ></b-icon>
                            </legend>
                            <ul class="layer-subgroup-body">
                                <li
                                    v-for="option in subgroup"
                                    :key="option.key"
                                    @click="toggleLayer(option)"
                                >
                                    <input
                                        type="checkbox"
                                        :checked="option.active">
                                    <label >{{option.value}}</label>
                                </li>
                            </ul>
                        </fieldset>
                    </div>
                </div>
            </section>
        </menu>
    </div>
</template>
<script>
import _ from "lodash";

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
    },
    data() {
        return {
            active_layers: {},
            active_base_layers: '',
        };
    },
    computed: {
        working_layers() {
            if (_.isEmpty(this.layers)) return [];
            return Object.values(this.layers).map(
                (layer) => {
                    return {
                        key: layer.id,
                        value: layer.name,
                        type: layer["sh_map_has_layer_type"],
                        image: layer["sh_map_has_layer_image"],
                        group: layer["sh_map_has_layer_group"],
                        subgroup: layer["sh_map_has_layer_subgroup"],
                        order: layer["sh_map_has_layer_order"],
                        // Si la capa está activa, se le asigna el valor true
                        active: (this.active_layers[layer.id] || layer.id == this.active_base_layers),
                    };
                }
            ).sort(
                (a, b) => {
                    return a.order - b.order;
                }
            );
        },
        // group layers by group and subgroup attributes
        grouped_layers() {
            // group layers by group attribute
            let grouped_layers = _.groupBy(this.working_layers, 'group');
            // group layers by subgroup attribute
            Object.keys(grouped_layers).forEach(
                (group_key) => {
                    grouped_layers[group_key] = _.groupBy(grouped_layers[group_key], 'subgroup')
                }
            )
            return grouped_layers;
        },
        css_vars() {
            let custom_styles;

            try {
                custom_styles = JSON.parse(this.custom_styles);
            } catch (e) {
                custom_styles = {};
            }	

            return {
                "--global-radius": custom_styles["global-radius"] || "8px",
                "--subgroup-accordion-color": custom_styles["subgroup-accordion-color"] || "#044617",
                "--subgroup-accordion-active-color": custom_styles["subgroup-accordion-color"] || "#46845C",
                "--subgroup-accordion-text-color": custom_styles["subgroup-accordion-text-color"] || "#FFFFFF",
                "--subgroup-checkbox-background": custom_styles["subgroup-checkbox-background"] || "transparent",
                "--subgroup-checkbox-border-color": custom_styles["subgroup-checkbox-border-color"] || "#f7f7f7t",
                "--option-color": custom_styles["option-color"] || "#001D09",
                "--option-active-color": custom_styles["option-active-color"] || "#7EF0A6",
                "--scrollbar-color": custom_styles["scrollbar-color"] || "#7EF0A6",
                "--scrollbar-color-hover": custom_styles["scrollbar-color-hover"] || "#17935BA7",
                "--button-color": custom_styles["button-color"] || "#6a6a6a22",
                "--button-hover-color": custom_styles["button-hover-color"] || "#044617",
                "--button-text-color": custom_styles["button-text-color"] || "#FFFFFF",
            };
        },
    },
    methods: {
        toggleLayer(layer) {
            if (layer.type == "base") {
                this.active_base_layers = (this.active_base_layers != layer.key)
                    ? layer.key
                    : '';
            } else {
                this.$set(this.active_layers, layer.key, !this.active_layers[layer.key])
            }
        },
    },
};
</script>

<style scoped lang="scss">
.layers-dropdown /deep/ {
    .layers-menu {
        h5 {
            font-size: 0.75rem;
            color: var(--option-active-color);
            margin-top: 30px;
            margin-bottom: 5px;
            text-align: left;
        }
        margin: 0;
        padding: 0 0 var(--global-radius) 0;
        overflow: auto;
        border-radius: var(--global-radius);
        max-height: 80vh;
        min-width: 250px;
        
        .layer-group {
            display: flex;
            max-width: 100%;
            flex-wrap: wrap;
            justify-content: space-between;
            .layer-option-wrapper {
                flex: 1;
                padding: 0 2px;
                margin-top: 0.5rem;
                &:hover,
                &:focus {
                    background-color: transparent;
                }
                .layer-option {
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    border-radius: var(--global-radius);
                    overflow: hidden;
                    height: 72px;
                    background-color: transparent;
                    border: none;
                    width: 100%;
                    padding: 0;
                    cursor: pointer;
                    .layer-option-body {
                        background: linear-gradient(
                            transparent 20%,
                            var(--option-color) 92%
                        );
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: flex-end;
                        padding: 0.3rem;
                        color: var(--button-text-color);
                        font-size: 0.75rem;
                        transition: all 0.4s ease;
                        box-sizing: border-box;
                        span {
                            max-width: 100%;
                            white-space: pre-wrap;
                            text-align: center;
                        }
                    }
                    &:hover .layer-option-body {
                        background: linear-gradient(transparent 20%, var(--button-hover-color) 92%);
                    }
                    .layer-option-active-icon{
                        display: none;
                        height: 0;
                        overflow: visible;
                        color: var(--option-active-color);
                        svg{
                            height: 16px;
                            width: 16px;
                            margin-top: 3px;
                            margin-right: 3px;
                        }
                    }
                    &.grouped {
                        background-color: var(--option-color);
                        .layer-option-body {
                            justify-content: space-around;
                            flex-flow: column;
                            align-items: center;
                            .layer-image-container {
                                display: flex;
                                justify-content: center;
                                height: 100%;
                                img {
                                    height: 90%;
                                    width: auto;
                                    max-width: 100%;
                                }
                            }
                        }
                    }
                }
                &.active {
                    .layer-option {
                        border: 2px solid var(--option-active-color);
                        .layer-option-active-icon{
                            display: flex;
                            justify-content: flex-end;
                        }
                        &.grouped {
                            background-color: var(--option-color);
                        }
                    }
                }
            }
        }
        .layer-subgroup{
            margin-top: 10px;
            fieldset{
                border: none;
                padding: 0;
                margin: 0;
                legend{
                    background-color: var(--subgroup-accordion-active-color);
                    color: var(--subgroup-accordion-text-color);
                    border-radius: calc( var(--global-radius) / 2);
                    width: 100%;
                    padding: 0 10px;
                    box-sizing: border-box;
                    text-align: initial;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    svg {
                        transition: transform 0.4s ease;
                        stroke-width: 1;
                        stroke: var(--subgroup-accordion-text-color);
                    }
                }
                ul.layer-subgroup-body{
                    padding: 15px 5px 15px 15px;
                    transition: all 0.4s ease;
                    text-align: left;
                    margin: 0;
                    li { 
                        list-style: none;
                        margin-top: 3px;
                        [type="checkbox"] {
                            width: 0;
                            height: 0;
                            overflow: hidden;
                            margin: 0;
                            padding: 0;
                        }
                        [type="checkbox"] + label {
                            position: relative;
                            color: var(--button-text-color);
                            font-size: 14px;
                            cursor: pointer;
                        }
                        [type="checkbox"] + label::before {
                            content: " ";
                            display: inline-block;
                            vertical-align: middle;
                            margin-right: 3px;
                            width: 10px;
                            height: 10px;
                            margin-top: -2px;
                            background-color: var(--subgroup-checkbox-background);
                            border-width: 2px;
                            border-style: solid;
                            border-color: var(--subgroup-checkbox-border-color);
                            border-radius: 8px;
                            box-shadow: none;
                            transition: all 0.4s ease;
                        }
                        [type="checkbox"] + label::after {
                            content: "•";
                            color: var(--option-active-color);
                            position: absolute;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            margin-left: 0px;
                            left: 0px;
                            top: 1px;
                            text-align: center;
                            background-color: transparent;
                            height: 16px;
                            width: 14px;
                            font-size: 31px;
                            opacity: 0;
                            transition: all 0.4s ease;
                        }
                        [type="checkbox"]:checked + label::before {
                            border-color: var(--option-active-color)
                        }
                        [type="checkbox"]:checked + label::after {
                            opacity: 1;
                        }
                    }
                }
                &.collapsed{
                    legend{
                        background-color: var(--subgroup-accordion-color);
                        svg{
                            transform: rotate(180deg);
                        }
                    }
                    ul.layer-subgroup-body{
                        height: 0;
                        padding: 0px 5px 0px 15px;
                        overflow: hidden;
                    }
                }
            }
        }
        &::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        &::-webkit-scrollbar-thumb {
            background: var(--scrollbar-color);
            border-radius: 4px;
            cursor: pointer;
        }
        &::-webkit-scrollbar-thumb:hover {
            background: var(--scrollbar-color-hover);
        }
        &::-webkit-scrollbar-thumb:active {
            background-color: var(--scrollbar-color);
        }
    }

   
}
</style>
