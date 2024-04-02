<template>
    <div class="layers-dropdown" ref="dropdown" :style="css_vars">
        <menu
            id="dropdown_base_layers"
            class="layers-menu"
        >
            <section v-for="(group, group_key) in grouped_layers"
                :key="group_key"
            >
                <div class="grouped-title">
                    <h5 @click="get_layers_group(group, group_key)">{{group_key}}</h5>
                    <b-icon icon="filter-circle-fill" @click="get_layers_group(group, group_key)"></b-icon>
                </div>
                <!-- Si no posee subgrupos -->
                <div v-for="(subgroup, subgroup_key) in group"
                    :key="subgroup_key" class="subgroup-container"
                >
                    <div
                        v-if="subgroup_key == 'null'"
                        class="layer-group"
                    >
                        <div
                            v-for="option in subgroup"
                            :key="option.key"
                            @click="toggleLayer(option, group)"
                            class="layer-option-wrapper"
                            :class="[{'active': option.active, 'disabled-layer': option.disabled }]"
                        >
                            <!-- Si existe mas de un subgrupo,
                                significa que debe tener un estilo distinto al estandar 
                            -->
                            <div v-if="Object.values(group).length > 1"
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
                            </div>
                            <!-- Si existe solo 1 subgrupo, debe tener un estilo
                            normal -->
                            <div
                                v-else
                                class="layer-option"
                                :style="{
                                    backgroundImage: `url(${base_url}${option.image})`,
                                }"
                                
                                :data-icon="option.icon"
                                :data-image="option.image"
                                :data-color="option.color"
                                :data-text-color="option.text_color"
                            >
                                <div class="layer-option-active-icon">
                                    <b-icon icon="dash-circle-fill"></b-icon>
                                </div>
                                <div class="layer-option-body">
                                    <span>{{ option.value }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else 
                        class="layer-subgroup" >
                        <!-- Para las capas subagrupadas
                        Se representan desde elementos colapsables -->
                        <fieldset class="collapsed">
                            <legend 
                                @click="e => e.currentTarget.parentNode.classList.toggle('collapsed')"
                                
                                :data-icon="subgroups_first_layer[subgroup_key].icon"
                                :data-image="subgroups_first_layer[subgroup_key].image"
                                :data-color="subgroups_first_layer[subgroup_key].color"
                                :data-text-color="subgroups_first_layer[subgroup_key].text_color"
                            >
                                <span>{{subgroup_key}}</span>
                                <b-icon
                                    icon="chevron-up"
                                    class="action-icon"
                                ></b-icon>
                            </legend>
                            <ul class="layer-subgroup-body">
                                <li
                                    v-for="option in subgroup"
                                    :key="option.key"
                                    @click="toggleLayer(option, group, subgroup)"
                                    :class="[{'disabled-layer': option.disabled }]"
                                >
                                    <input
                                        type="checkbox"
                                        :checked="option.active"
                                        :id="option.key"
                                        :disabled="option.disabled"
                                        
                                        :data-icon="option.icon"
                                        :data-image="option.image"
                                        :data-color="option.color"
                                        :data-text-color="option.text_color"
                                        >
                                    <label >{{option.value}}</label>
                                </li>
                            </ul>
                        </fieldset>
                    </div>
                    <SheetsTooltip v-if="subgroup[0].enriched_data" :data="subgroup[0].enriched_data" :layerKey="subgroup[0].key" />
                </div>
            </section>
            <div class="layers-actions">
                <div class="my-2" v-if="Object.values(grouped_layers).length > 1">
                    <button class="btn btn-success btn-sm uncheck-layers" @click="uncheckLayers" data-toggle="tooltip" data-placement="right" title="Desmarca todas las capas seleccionadas">Desmarcar capas</button>
                </div>
                <div class="points-clustering-container">
                    <input type="checkbox" id="clusterize" v-model="clusterize" class="points-clustering-input"/>
                    <label class="points-clustering-text" for="clusterize" >Agrupar puntos</label>
                </div>
            </div>
        </menu>
    </div>
</template>
<script>
import _ from "lodash";
import { BIcon } from 'bootstrap-vue';
import SheetsTooltip from "./SheetsTooltip.vue";

export default {
    components: {
        BIcon,
        SheetsTooltip
    },
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
        layer_from_map: Object,
    },
    data() {
        return {
            active_layers: {},
            active_base_layers: '',
            active_groups: {},
            disabled_layers: {},
            clusterize: true,
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
                        enriched_data: layer["enriched_data"],
                        layers_to_filter: layer["sh_map_has_layer_filter_layers"],
                        group_subgroup_limit: layer["sh_map_has_layer_group_selection_limit"],
                        disabled: (this.disabled_layers[layer.id]),
                        quickLayer: layer["sh_map_has_layer_quick_layer"],
                        color: layer['sh_map_has_layer_color'],
                        text_color: layer['sh_map_has_layer_text_color'],
                        icon: layer['sh_map_has_layer_point_image']
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
        subgroups_first_layer() {
            let subgroup_first_layer = {};

            Object.values(this.grouped_layers).forEach((group) => {
                Object.keys(group).forEach((subgroup_key) => {
                    subgroup_first_layer[subgroup_key] = Object.values(group[subgroup_key]).find( v => v.icon)
                        || Object.values(group[subgroup_key]).find( v => v.color)
                        || Object.values(group[subgroup_key]).find( v => v)
                });
            });
            
            return subgroup_first_layer;
        },
        groups_first_layer() {
            let group_first_layer = {};

            Object.keys(this.grouped_layers).forEach((group_key) => {
                try{
                    const first_subgroup = Object.values(this.grouped_layers[group_key])?.find( v => v.icon)
                        || Object.values(this.grouped_layers[group_key]).find( v => v.color)
                        || Object.values(this.grouped_layers[group_key])?.find( v => v)
                    const first_layer = Object.values(first_subgroup)?.find( v => v);
                    group_first_layer[group_key] = first_layer;
                } catch (e) {
                    // do nothing 
                }
            });

            return group_first_layer;
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
                "--subgroup-accordion-active-color": custom_styles["subgroup-accordion-active-color"] || "#46845C",
                "--subgroup-accordion-text-color": custom_styles["subgroup-accordion-text-color"] || "#FFFFFF",
                "--subgroup-checkbox-background": custom_styles["subgroup-checkbox-background"] || "transparent",
                "--subgroup-checkbox-border-color": custom_styles["subgroup-checkbox-border-color"] || "#f7f7f7t",
                "--subgroup-checkbox-border-radius": custom_styles["subgroup-checkbox-border-radius"] || "8px",
                "--option-color": custom_styles["option-color"] || "#001D09",
                "--option-active-color": custom_styles["option-active-color"] || "#7EF0A6",
                "--scrollbar-color": custom_styles["scrollbar-color"] || "#7EF0A6",
                "--scrollbar-color-hover": custom_styles["scrollbar-color-hover"] || "#17935BA7",
                "--button-color": custom_styles["button-color"] || "#6a6a6a22",
                "--button-hover-color": custom_styles["button-hover-color"] || "#044617",
                "--button-text-color": custom_styles["button-text-color"] || "#FFFFFF",
                "--link-color": custom_styles["link-color"] || "#7EF0A6",
                "--tooltip-text-color": custom_styles["tooltip-text-color"] || "white",
            };
        },
    }, 
    watch: {
        layer_from_map(layer, oldLayer) {
            if(layer && oldLayer && layer.timestamp !== oldLayer.timestamp) {
                this.setLayerFromMap(layer);
            }

            if(layer && !oldLayer) {
                this.setLayerFromMap(layer);
            }
        },
        clusterize(state) {
            this.$emit('clusterize', state);
        },
    },
    methods: {
        toggleLayer(layer, group, subgroup) {
            // If the layer is a base layer, toggle it on or off
            if (layer.type == "base") {
                this.active_base_layers = (this.active_base_layers != layer.key)
                    ? layer.key
                    : '';
            } else {
                // If the layer is not a base layer, toggle it in the active_layers object
                this.$set(this.active_layers, layer.key, !this.active_layers[layer.key])
            }

            // If the layer is not active, delete it from the active_layers object
            if(!this.active_layers[layer.key]) {
                delete this.active_layers[layer.key];
            }

            this.checkSelectedLayers(layer, group, subgroup);
        },

        // This method toggles the state of a group of layers and filters the layers in the group
        get_layers_group(group, groupKey) {
            // Toggle the active state of the group
            this.$set(this.active_groups, groupKey, !this.active_groups[groupKey])

            // Create an array to store all of the layers that need to be toggled
            let layers_to_filter = []

            // Loop through each group
            Object.keys(group).forEach(
                (group_key) => {
                    // Loop through each layer in the group
                    group[group_key].forEach((layer)=> {
                        // If the layer has a "layers_to_filter" property, add the layers to the array of layers to toggle
                        if(layer["layers_to_filter"]) {
                            const layers = JSON.parse(layer["layers_to_filter"]);

                            layers.forEach((layer) => {
                                layers_to_filter.push(layer)
                            });
                        }
                    });
                }
            );

            if(layers_to_filter.length > 0) {
                this.filter_layers_group(groupKey, layers_to_filter);
            }
        },

        // function to filter layers by group
        filter_layers_group(groupKey, layers_to_filter) {
            // check if the groupKey is active
            if(this.active_groups[groupKey]) {
                // if it is, turn off all other layers
                for(const [key] of Object.entries(this.active_layers)) {
                    let findLayerBaseType = this.working_layers.find(layer => layer.key == key);

                    if(key !== findLayerBaseType.key && findLayerBaseType.type !== "base") {
                        this.$set(this.active_layers, key, false)
                    }
                }

                // then turn on the layers that are in the groupKey
                layers_to_filter.forEach(ftl => {
                        this.$set(this.active_layers, ftl, false);
                });
            }

            // if the groupKey is not active
            if(!this.active_groups[groupKey]) {
                // turn on all other layers
                for (const [key] of Object.entries(this.active_layers)) {
                    this.$set(this.active_layers, key, true)
                }
                // then delete the groupKey
                delete this.active_groups[groupKey];
            }
        },

        // This method is used to set the layer from the mapbox layer
        setLayerFromMap(layer) {
            // Get the grouped layers
            let group = this.grouped_layers[layer.group];

            // Check if the layer is active and the group exists
            if(this.active_layers[layer.key] && group) {
                // Get the layers inside the group
                this.get_layers_group(group, layer.group);
            }
            
            this.toggleLayer(layer);
        },
        uncheckLayers() {
            this.active_layers = {};
            this.active_base_layers = '';
            this.active_groups = {};
            this.disabled_layers = {};
        },
        // This method is used to get the total of selectable layers in a group
        totalSelectableGroups(group) {
            let total = 0;

            Object.keys(group).forEach(
                (group_key) => {
                    group[group_key].forEach((layer) => {
                        if(layer.group_subgroup_limit) {
                            total += layer.group_subgroup_limit;
                        }
                    });
                }
            );

            return total;
        },
        // This method is used to get the total of selectable layers in a subgroup
        totalSelectableSubgroups(subgroup) {
            let total = 0;

            subgroup.forEach((layer) => {
                if(layer.group_subgroup_limit) {
                    total += layer.group_subgroup_limit;
                }
            });

            return total;
        },
        // This method is used to check the selected layers
        checkSelectedLayers(layer, group, subgroup) {
            let totalGroup = 0;
            let totalSubgroup = 0;
            // If the layer has not a subgroup, get the total of selectable layers in the group
            if(group && !subgroup) {
                totalGroup = this.totalSelectableGroups(group);
                if(this.totalSelectableGroups(group) > 0) {
                    group[layer.subgroup].forEach((l) => {
                        Object.keys(this.active_layers).forEach((al) => {
                            if(l.key == al) {
                                totalGroup--;
                            }
                        });
                    });
                }

                if(totalGroup == 0 && this.totalSelectableGroups(group) > 0) {
                    let layersNotSelected = group[layer.subgroup].filter((l) => {
                        return !this.active_layers[l.key];
                    });
                    
                    layersNotSelected.forEach((l) => {
                        this.$set(this.disabled_layers, l.key, !this.disabled_layers[l.key])
                    });
                }

                if(totalGroup >= 1 && this.totalSelectableGroups(group) > 0) {
                    group[layer.subgroup].forEach((l) => {
                        Object.keys(this.disabled_layers).forEach((al) => {
                            if(l.key === al) {
                                delete this.disabled_layers[l.key];
                            }
                        });
                    });
                }
            }
            // If the layer has a subgroup, get the total of selectable layers in the subgroup
            if(subgroup) {
                totalGroup = this.totalSelectableGroups(group);
                totalSubgroup = this.totalSelectableSubgroups(subgroup);

                let countSelectedLayers = 0;
                Object.values(group).forEach((group) => {
                    group.forEach((l) => {
                        Object.keys(this.active_layers).forEach((al) => {
                            if(l.key == al) {
                                countSelectedLayers++;
                            }
                        });
                    });
                });

                if(countSelectedLayers < this.totalSelectableGroups(group)) {
                    let layersToDisabled = []

                    Object.values(group).forEach((group) => {
                        let layersNotSelected = group.filter((l) => {
                            return !this.active_layers[l.key];
                        });

                        layersNotSelected.forEach((l) => {
                            layersToDisabled.push(l.key);
                        });
                    });

                    let disabledLayers = layersToDisabled.filter((l) => {
                        return this.disabled_layers[l];
                    });

                    disabledLayers.forEach((l) => {
                        delete this.disabled_layers[l];
                    });
                }

                if(this.totalSelectableSubgroups(subgroup) > 0) {
                    group[layer.subgroup].forEach((l) => {
                        Object.keys(this.active_layers).forEach((al) => {
                            if(l.key == al) {
                                totalGroup--;
                                totalSubgroup--;
                            }
                        });
                    });
                }

                if(totalSubgroup == 0 && this.totalSelectableSubgroups(subgroup) > 0) {
                    let layersNotSelected = group[layer.subgroup].filter((l) => {
                        return !this.active_layers[l.key];
                    });

                    layersNotSelected.forEach((l) => {
                        this.$set(this.disabled_layers, l.key, !this.disabled_layers[l.key])
                    });
                }

                if(totalSubgroup >= 1 && this.totalSelectableSubgroups(subgroup) > 0) {
                    group[layer.subgroup].forEach((l) => {
                        Object.keys(this.disabled_layers).forEach((al) => {
                            if(l.key === al) {
                                delete this.disabled_layers[l.key];
                            }
                        });
                    });
                }

                if(countSelectedLayers == this.totalSelectableGroups(group)) {
                    let layersToDisabled = []

                    Object.values(group).forEach((group) => {
                        let layersNotSelected = group.filter((l) => {
                            return !this.active_layers[l.key];
                        });

                        layersNotSelected.forEach((l) => {
                            layersToDisabled.push(l.key);
                        });
                    });

                    let disabledLayers = layersToDisabled.filter((l) => {
                        return !this.disabled_layers[l];
                    });

                    disabledLayers.forEach((l) => {
                        this.$set(this.disabled_layers, l, !this.disabled_layers[l])
                    });
                }
            }
        }
    },
};
</script>

<style scoped lang="scss">
.subgroup-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;

    .disabled-layer {
        pointer-events: none;
        opacity: 0.4; /* Optional: Add some visual cue that element is disabled */
    }
}
.layers-dropdown /deep/ {
    .layers-menu {
        .grouped-title {
            display: flex;
            flex-direction: row;
            justify-content: space-between;

            h5 {
                cursor: pointer;
                font-size: 0.8rem;
                color: var(--option-active-color);
                margin-top: 30px;
                margin-bottom: 5px;
                text-align: left;
            }
            svg {
                cursor: pointer;
                color: var(--option-active-color);
                margin-top: 30px;
                margin-bottom: 5px;
                margin-right: 2px;
            }
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
            width: 100%;
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
                            margin-top: 2px;
                            margin-right: 2px;
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
            width: 92%;
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
                    font-size: .8rem;
                    margin: 0;
                    span {
                        order: 1;
                        width: inherit;
                    }
                    svg {
                        margin: 4px 0 0 4px;
                        order: 2;
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
                            box-sizing: border-box;
                        }
                        [type="checkbox"] + label::before {
                            content: " ";
                            background-color: var(--subgroup-checkbox-background);
                            border-color: var(--subgroup-checkbox-border-color);
                            border-radius: var(--subgroup-checkbox-border-radius);
                            display: inline-block;
                            vertical-align: middle;
                            margin-right: 3px;
                            width: 12px;
                            height: 12px;
                            margin-top: 0px;
                            border-width: 2px;
                            border-style: solid;
                            box-shadow: none;
                            transition: all 0.4s ease;
                            box-sizing: border-box;
                        }

                        [type="checkbox"]:checked + label::before {
                            background-color: var(--option-active-color);
                            border-color: var(--option-active-color)
                        }
                    }
                }
                &.collapsed{
                    legend{
                        background-color: var(--subgroup-accordion-color);
                        svg.action-icon{
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
    .layers-actions {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-around;
        align-items: center;
        margin-top: 1rem;
        .uncheck-layers {
            padding: 0.3rem 0.5rem;
            color: var(--button-text-color);
            background-color: var(--button-hover-color);
            border: none;
            border-radius: var(--global-radius);
            font-size: 0.8rem;
            cursor: pointer;

            &:hover{
                background-color: var(--button-color);
            }
        }
        .points-clustering-container {
            display: flex;
            align-items: center;

            input[type=checkbox] {
                cursor: default;
            }

            .points-clustering-input {
                appearance: none;
                background-color: var(--button-color);
                border-radius: 72px;
                border-style: none;
                flex-shrink: 0;
                height: 20px;
                margin: 0;
                position: relative;
                width: 30px;

                &:before{
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
                    background-color:  var(--button-color);
                    transition-duration: 0s;
                }

                &:checked {
                    background-color: var(--button-hover-color);
                }

                &:checked{
                    &:after {
                        background-color: #fff;
                        left: 13px;
                    }
                }
                &:checked{
                    &:hover {
                        background-color: var(--button-hover-color);
                    }
                }
            }
            .points-clustering-text {
                margin-bottom: 0;
                margin-left: 4px;
                color: var(--option-active-color);
                font-size: 0.6rem;
            }

            &:focus:not(.focus-visible) {
                outline: 0;
            }
        }
        
    }
}
</style>
