<template>
    <div :style="css_vars">
        <button v-if="config.sh_map_has_show_this_zone" type="button" class="btn btn-filter" v-on:click="filter()">
            Ver esta zona
        </button>
        <div ref="map_container">
            <!-- https://vue2-leaflet.netlify.app/ -->
            <!-- https://vue2-leaflet.netlify.app/components/LMap.html#demo -->
            <l-map 
                @ready="ready()"
                @moveend="onMapMoveEnd();"
                @click="onMapClick"
                :zoom.sync="zoom"
                :center.sync="center"
                ref="my_map"
                class="my-map"
                :class="{ 'hide-cluster-labels': should_hide_cluster_labels }"
                :options="{ zoomControl: false, trackResize: false }">

                <section class="custom-controls">
                    <search-bar-proxy
                        v-if="config.sh_map_search_component && config.sh_map_search_component_config"
                        :componentName="config.sh_map_search_component"
                        :config="JSON.parse(config.sh_map_search_component_config)"
                        @change-location="zoomToLocation" />
                    <b-button class="zoom-btn" @click.capture.stop="zoomMap('out')" title="Alejar">
                        <b-icon icon="dash-lg"></b-icon>
                    </b-button>
                    <b-button class="zoom-btn" @click.capture.stop="zoomMap('in')" title="Acercar">
                        <b-icon icon="plus-lg"></b-icon>
                    </b-button>
                    <b-button class="zoom-btn" @click.capture.stop="polygonAction('draw')" title="Traza libremente sobre el mapa">
                        <b-icon icon="pencil"></b-icon>
                    </b-button>
                    <b-button class="zoom-btn" @click.capture.stop="polygonAction('delete')" title="Elimina los trazos libres en el mapa">
                        <b-icon icon="x-octagon"></b-icon>
                    </b-button>
                </section>

                <l-marker v-if="shouldShowSearchMarker" :latLng="searchMarkerLatLng" ></l-marker>
                
                <!-- https://vue2-leaflet.netlify.app/components/LTileLayer.html -->
                <!-- <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer> -->
                <l-tile-layer v-if="base_open_street_map"
                    :url="base_open_street_map.sh_map_has_layer_url"
                    ></l-tile-layer>
                <l-tile-layer v-else-if="base_google_map"
                    :url="base_google_map.sh_map_has_layer_url"
                    ></l-tile-layer>
                <l-tile-layer v-else-if="base_map_guide"
                    :url="base_map_guide.sh_map_has_layer_url"
                    ></l-tile-layer>
                <l-tile-layer v-else :url="default_base_layer"
                    :attribution="default_attribution"
                    ></l-tile-layer>
                
                    <!--https://vue2-leaflet.netlify.app/components/LCircleMarker.html -->
                <supercluster-layer
                    :visible="active_layers.some(layer => layer.sh_map_has_layer_type === 'supercluster')"
                    :data="data"
                    :info="info"
                    :map="map"
                    :config="config"
                    :col_lat="col_lat"
                    :col_lng="col_lng"
                    :entity_type_id="entity_type_id"
                    :base_url="base_url"
                    ref="analytic_cluster_layer"
                ></supercluster-layer>   
                <!-- 
                    Analytic layers 
                        - Analytic Cluster 
                        - Analytic GeoJson 
                -->
                <l-geo-json v-if="analytic_cluster != undefined" :geojson="analytic_cluster.geo_json" :options-style="analytic_cluster_style" :options="analytic_cluster_options"></l-geo-json>
                <div v-if="analytic_geojson_list.length > 0">
                    <div v-for="analytic_geojson in analytic_geojson_list" :key="analytic_geojson.id">
                        <l-geo-json :geojson="analytic_geojson.geojson" :options-style="analytic_geojson_style" :options ="geojson_options"></l-geo-json>
                    </div>
                    
                </div>
                <!-- End Analytic layers -->

                <!-- Operative layers -->

                <div v-if="operative_geojson_list.length > 0">
                    <div v-for="operative_geojson in operative_geojson_list" :key="operative_geojson.id">
                        <l-geo-json :geojson="operative_geojson.geojson" :options-style="operative_geojson_style" :options ="geojson_options"></l-geo-json>
                    </div>
                    
                </div>

                <!-- Polygon draft-->

                <polygon-drafter
                  :info="info"
                  ref="polygon_drafter"
                  v-on:apply-filter="polygonFilter"
                ></polygon-drafter>

                <!-- Escribir URL y hardcodear atributos para ver priori de capas operativas -->
                <l-wms-tile-layer
                    v-for="layer in (operative_geoserver_wms || [])"
                    :key="layer.id"
                    :base-url="layer.sh_map_has_layer_url"
                    :layers="layer.sh_map_has_layer_geoserver_layer"
                    :name="layer.sh_map_has_layer_geoserver_layer"
                    :transparent="true"
                    format="image/png"
                    layer-type="base"
                    service="WMS"
                />
            </l-map>
        </div>
    </div>
        
</template>
<script>
import L from 'leaflet';
import _ from 'lodash';
import {LMap, LTileLayer, LMarker, LGeoJson, LWMSTileLayer } from 'vue2-leaflet';
import SearchBarProxy from './SearchBarProxy.vue';
import SuperclusterLayer from './layers/SuperclusterLayer.vue';
import PolygonDrafter from './PolygonDrafter.vue';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import axios from 'axios';
import HeatmapOverlay from'heatmap.js/plugins/leaflet-heatmap'
import { BButton, BIcon } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default {
    name: 'SheetsMap',
    components: {
        LMap,
        LTileLayer,
        LMarker,
        LGeoJson,
        "l-wms-tile-layer": LWMSTileLayer,
        BButton,
        BIcon,
        SearchBarProxy,
        SuperclusterLayer,
        PolygonDrafter
    },
    props: {
        // Propiedades de componentes
        id                    : String,
        entity_type_id        : String,
        config_entity_id      : String,
        config_entity_type_id : String,
        endpoint_config       : String,
        code                  : String,
        base_url              : String,
        custom_styles         : String,
        // Propiedades que provienen del store
        active_filters        : Array,
        info                  : Object,
        data                  : Object,
        // SheetsMapTools
        config                : Object, // Todas las capas
        layers                : Object, // Todas las capas
        working_layers        : Array
    },
    data () {
        return {
            url: '',
            default_base_layer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            default_attribution: '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            zoom                      : 7,
            center_default            : [-33.472 , -70.769],
            center                    : undefined,
            col_lat                   : undefined,
            col_lng                   : undefined,
            map                       : undefined,
            circle                    : undefined,
            /*Layers*/
            /** Zoom del mapa al momento de carga analytic_cluster. */
            analytic_cluster_initial_zoom: undefined,
            should_hide_cluster_labels: false,
            analytic_cluster          : undefined,
            analytic_countour_map     : undefined,
            analytic_geojson_list     : [],
            analytic_geojson_features : [],
            operative_geojson_list    : [],
            operative_geojson_features : [],
            base_google_map           : undefined,
            base_map_guide            : undefined,
            base_open_street_map      : undefined,
            operative_geoserver_wms   : [],
            bounds_filters            : [],
            num_zoom                  : false,
            bounds                    : [],
            h3                        : require("h3-js"),
            shouldShowSearchMarker    : false,
            searchMarkerLatLng        : null,
            // Usadas para las capas analiticas tipo analytic_geojson
            should_skip_bounds_filter : false, // Usada para no filtrar por los limites del mapa en analytic_geojson
        };
    },
    computed:{
        css_vars() {
            let custom_styles = JSON.parse(this.custom_styles) || {};

            return {
                "--sh-map-zoom-button-background-color"      : custom_styles["zoom-button-background-color"]       || "#001D09",
                "--sh-map-zoom-button-text-color"            : custom_styles["zoom-button-text-color"]             || "#D3D3D3",
                "--sh-map-radius-multiplier"                 : custom_styles["radius-multiplier"]                  || "8px",
                //Pop-up
                "--sh-map-marker-pop-up-background"          : custom_styles["marker-pop-up-background"]           || "white",
                "--sh-map-marker-pop-up-border-color"        : custom_styles["marker-pop-up-border-color"]         || "white",
                "--sh-map-marker-pop-up-border-width"        : custom_styles["marker-pop-up-border-width"]         || "0px",
                "--sh-map-marker-pop-up-border-style"        : custom_styles["marker-pop-up-border-style"]         || "solid",

                "--sh-map-marker-pop-up-title-font"          : custom_styles["marker-pop-up-title-font"]           || '"Helvetica Neue", Arial, Helvetica, sans-serif',
                "--sh-map-marker-pop-up-title-color"         : custom_styles["marker-pop-up-title-color"]          || "black",
                "--sh-map-marker-pop-up-content-font"        : custom_styles["marker-pop-up-content-font"]         || '"Helvetica Neue", Arial, Helvetica, sans-serif',
                "--sh-map-marker-pop-up-content-color"       : custom_styles["marker-pop-up-content-color"]        || "black",

                "--sh-map-marker-pop-up-srcoll-color"        : custom_styles["marker-pop-up-scroll-color"]         || "#999393",
                "--sh-map-marker-pop-up-srcoll-color-hover"  : custom_styles["marker-pop-up-scroll-color-hover"]   || "#b3b3b3",
                "--sh-map-marker-pop-up-srcoll-color-active" : custom_styles["marker-pop-up-scroll-color-active"]  || "#999999",
                //Point Clusters
                //Small
                "--sh-map-point-cluster-small-size"          : custom_styles["point-cluster-small-size"]           || "30px", 
                "--sh-map-point-cluster-small-font"          : custom_styles["point-cluster-small-font"]           || '12px "Helvetica Neue", Arial, Helvetica, sans-serif', 
                "--sh-map-point-cluster-small-font-color"    : custom_styles["point-cluster-small-font-color"]     || 'black', 
                "--sh-map-point-cluster-small-color"         : custom_styles["point-cluster-small-color"]          || "rgba(181, 226, 140, 0.6)", 
                "--sh-map-point-cluster-small-color-div"     : custom_styles["point-cluster-small-color-div"]      || "rgba(110, 204, 57, 0.6)", 
                "--sh-map-point-cluster-small-border-color"  : custom_styles["point-cluster-small-border-color"]   || "rgba(181, 226, 140, 0.6)", 
                "--sh-map-point-cluster-small-border-style"  : custom_styles["point-cluster-small-border-style"]   || "hidden", 
                "--sh-map-point-cluster-small-border-width"  : custom_styles["point-cluster-small-border-width"]   || "1px", 
                //Medium
                "--sh-map-point-cluster-medium-size"         : custom_styles["point-cluster-medium-size"]          || "30px", 
                "--sh-map-point-cluster-medium-font"         : custom_styles["point-cluster-medium-font"]          || '12px "Helvetica Neue", Arial, Helvetica, sans-serif', 
                "--sh-map-point-cluster-medium-font-color"   : custom_styles["point-cluster-medium-font-color"]    || 'black', 
                "--sh-map-point-cluster-medium-color"        : custom_styles["point-cluster-medium-color"]         || "rgba(241, 211, 87, 0.6)", 
                "--sh-map-point-cluster-medium-color-div"    : custom_styles["point-cluster-medium-color-div"]     || "rgba(240, 194, 12, 0.6)", 
                "--sh-map-point-cluster-medium-border-color" : custom_styles["point-cluster-medium-border-color"]  || "rgba(241, 211, 87, 0.6)", 
                "--sh-map-point-cluster-medium-border-style" : custom_styles["point-cluster-medium-border-style"]  || "hidden", 
                "--sh-map-point-cluster-medium-border-width" : custom_styles["point-cluster-medium-border-width"]  || "1px", 
                //Large
                "--sh-map-point-cluster-large-size"          : custom_styles["point-cluster-large-size"]           || "30px", 
                "--sh-map-point-cluster-large-font"          : custom_styles["point-cluster-large-font"]           || '12px "Helvetica Neue", Arial, Helvetica, sans-serif', 
                "--sh-map-point-cluster-large-font-color"    : custom_styles["point-cluster-large-font-color"]     || 'black', 
                "--sh-map-point-cluster-large-color"         : custom_styles["point-cluster-large-color"]          || "rgba(253, 156, 115, 0.6)", 
                "--sh-map-point-cluster-large-color-div"     : custom_styles["point-cluster-large-color-div"]      || "rgba(241, 128, 23, 0.6)", 
                "--sh-map-point-cluster-large-border-color"  : custom_styles["point-cluster-large-border-color"]   || "rgba(253, 156, 115, 0.6)", 
                "--sh-map-point-cluster-large-border-style"  : custom_styles["point-cluster-large-border-style"]   || "hidden", 
                "--sh-map-point-cluster-large-border-width"  : custom_styles["point-cluster-large-border-width"]   || "1px",

                
            };

        },
        style_variables() {
            let custom_styles = JSON.parse(this.custom_styles) || {};

            return {
                // Hexagonal Clusters Style
                "hexagonal-cluster-small-color"           : custom_styles["hexagonal-cluster-small-color"]           || "#F9E79F",
                "hexagonal-cluster-small-opacity"         : custom_styles["hexagonal-cluster-small-opacity"]         || 0.6,
                "hexagonal-cluster-small-border-color"    : custom_styles["hexagonal-cluster-small-border-color"]    || "#ECEFF1",
                "hexagonal-cluster-small-border-opacity"  : custom_styles["hexagonal-cluster-small-border-opacity"]  || 0.6,
                "hexagonal-cluster-small-font"            : custom_styles["hexagonal-cluster-small-font"]            || "",
                "hexagonal-cluster-small-font-color"      : custom_styles["hexagonal-cluster-small-font-color"]      || "",
                "hexagonal-cluster-medium-color"          : custom_styles["hexagonal-cluster-medium-color"]          || "#FCAC49",
                "hexagonal-cluster-medium-opacity"        : custom_styles["hexagonal-cluster-medium-opacity"]        || 0.6,
                "hexagonal-cluster-medium-border-color"   : custom_styles["hexagonal-cluster-medium-border-color"]   || "#ECEFF1",
                "hexagonal-cluster-medium-border-opacity" : custom_styles["hexagonal-cluster-medium-border-opacity"] || 0.6,
                "hexagonal-cluster-medium-font"           : custom_styles["hexagonal-cluster-medium-font"]           || "",
                "hexagonal-cluster-medium-font-color"     : custom_styles["hexagonal-cluster-medium-font-color"]     || "#E74C3C",
                "hexagonal-cluster-large-color"           : custom_styles["hexagonal-cluster-large-color"]           || "",
                "hexagonal-cluster-large-opacity"         : custom_styles["hexagonal-cluster-large-opacity"]         || 0.6,
                "hexagonal-cluster-large-border-color"    : custom_styles["hexagonal-cluster-large-border-color"]    || "#ECEFF1",
                "hexagonal-cluster-large-border-opacity"  : custom_styles["hexagonal-cluster-large-border-opacity"]  || 0.6,
                "hexagonal-cluster-large-font"            : custom_styles["hexagonal-cluster-large-font"]            || "",
                "hexagonal-cluster-large-font-color"      : custom_styles["hexagonal-cluster-large-font-color"]      || "",
                // Analytic GeoJson Style
                "analytic-geojson-small-color"          : custom_styles["analytic-geojson-small-color"]          || "#FDFEFE",
                "analytic-geojson-small-border-color"   : custom_styles["analytic-geojson-small-border-color"]   || "#FDFEFE",
                "analytic-geojson-large-color"          : custom_styles["analytic-geojson-large-color"]          || "#0074BD",
                "analytic-geojson-large-border-color"   : custom_styles["analytic-geojson-large-border-color"]   || "#0074BD",
                "analytic-geojson-opacity"              : custom_styles["analytic-geojson-opacity"]              || 0.6,
                "analytic-geojson-border-opacity"       : custom_styles["analytic-geojson-border-opacity"]       || 1,
                // Analytic GeoJson Poits Style
                "analytic-geojson-point-icon-size"    : custom_styles["analytic-geojson-point-icon-size"]    || 38,
                "analytic-geojson-point-icon-anchor"  : custom_styles["analytic-geojson-point-icon-anchor"]  || 25,
                "analytic-geojson-point-popup-anchor" : custom_styles["analytic-geojson-point-popup-anchor"] || 0,
                
            };

        },

        analytic_cluster_options() {
          return {
            onEachFeature: function(feature, layer) {
                layer.bindTooltip(function (layer) {
                    return `${layer.feature.properties.total.toLocaleString('es-ES')}`; 
                }, {permanent: true, direction: "center", className: "my-labels"});
            }
          };
        },
        geojson_options() {
          return {
            pointToLayer: (feature, latLng) => {
                //Obtenemos la configuración de la capa a la que pertenece
                const active_layer = this.active_layers.find(l => {
                    return feature.layer_id == l.id;
                });

                if (active_layer.sh_map_has_layer_point_image != null) {
                    const icon_size    = this.style_variables['analytic-geojson-point-icon-size'];
                    const icon_anchor  = this.style_variables['analytic-geojson-point-icon-anchor'];
                    const popup_anchor = this.style_variables['analytic-geojson-point-popup-anchor'];

                    const icon = L.icon({
                        iconUrl: this.base_url+active_layer.sh_map_has_layer_point_image,
                        iconSize:     [icon_size, icon_size], // size of the icon
                        iconAnchor:   [icon_anchor, icon_anchor], // point of the icon which will correspond to marker's location
                        popupAnchor:  [popup_anchor, popup_anchor] // point from which the popup should open relative to the iconAnchor
                    })
                    return L.marker(latLng, {icon: icon})
                }

                return L.marker(latLng)

            },
            onEachFeature: (feature, layer) => {
                if (Object.values(feature.properties)?.length < 1) {
                    return;
                }
                layer.bindPopup((layer) => {
                    //Obtenemos la configuración de la capa a la que pertenece
                    const active_layer = this.active_layers.find(l => {
                        return layer.feature.layer_id == l.id;
                    });

                    let info = ['Sin información disponible']; //Información a retornar en el popup
                    const property_configuration = active_layer.sh_map_has_layer_property_keys; //obtiene la configuración dada pera las columnas del popup

                    // Revisamos si la capa tiene alguna configuración especial para mostrar los datos almacenados en property
                    // Si no los tiene retornamos solo el valor calculado entre el Bi y feature
                    if (property_configuration == null) {
                        switch(active_layer.sh_map_has_layer_code){
                            case 'analytic_geojson' :{
                                //Almacenamos el calculo hecho entre el Bi y el feature
                                const [metric_value] = Object.values(layer.feature.properties.metric_data);
                                const total = (metric_value == null) ? 'Sin información disponible' : metric_value.toLocaleString('es-ES');

                                return `<span class="marker-pop-up-info-content"> ${total} </span>`;

                            }
                            case 'operative_geoserver_wfs_point' :{

                                info = this.infoGeojsonWithKeys(layer, false);
                                break;
                            }
                        }
                    }else{

                        //Si sh_map_has_layer_property_keys esta configurada como * entonces agregamos la info existente en properties con llaves más amigables
                        if ((property_configuration).charAt(0) == '*') {
                            const human_keys = (property_configuration == '*') ? true : false;
                            info = this.infoGeojsonWithKeys(layer, human_keys);
                        }

                        // Si la configuración proporcionada es un json entonces retorna la configuración + alias proporcionado por la configuración
                        if (this.isJson(property_configuration)) {
                            let property_keys = JSON.parse(property_configuration);
                            info = this.infoGeojsonWithAlias(layer, property_keys);
                        }
                    }
                    

                    return `${info.join('<br>')}`;
                }, {permanent: false, direction: "center", className: "marker-pop-up-content"});
            }
          };
        },
        heatmapLayer() {

            let config = {
              'radius': 100,
              'maxOpacity': 0.8,
              'scaleRadius': false,
              'useLocalExtrema': true,
              latField:'lat',
              lngField:'lng',
              valueField:'count',
            };

            let heatmapLayer = new HeatmapOverlay(config);

            return heatmapLayer;
        },
        analytic_cluster_style() {
            return (feature) => {
                let color;
                let opacity;
                let border_color;
                // let border_opacity;
                // let font;
                // let font_color;

                //Concentración Alta
                if (feature.properties.total >= this.config.sh_map_large_cluster_size_starts_at) {
                    color          = this.style_variables["hexagonal-cluster-large-color"];
                    opacity        = this.style_variables["hexagonal-cluster-large-opacity"];
                    border_color   = this.style_variables["hexagonal-cluster-large-border-color"];
                    // border_opacity = this.style_variables["hexagonal-cluster-large-border-opacity"];
                    // font           = this.style_variables["hexagonal-cluster-large-font"];
                    // font_color     = this.style_variables["hexagonal-cluster-large-font-color"];
                }

                //Concentración Media 
                if (feature.properties.total < this.config.sh_map_large_cluster_size_starts_at) {
                    color          = this.style_variables["hexagonal-cluster-medium-color"];
                    opacity        = this.style_variables["hexagonal-cluster-medium-opacity"];
                    border_color   = this.style_variables["hexagonal-cluster-medium-border-color"];
                    // border_opacity = this.style_variables["hexagonal-cluster-medium-border-opacity"];
                    // font           = this.style_variables["hexagonal-cluster-medium-font"];
                    // font_color     = this.style_variables["hexagonal-cluster-medium-font-color"];
                }
                //Baja
                if (feature.properties.total < this.config.sh_map_medium_cluster_size_starts_at) {
                    color          = this.style_variables["hexagonal-cluster-small-color"];
                    opacity        = this.style_variables["hexagonal-cluster-small-opacity"];
                    border_color   = this.style_variables["hexagonal-cluster-small-border-color"];
                    // border_opacity = this.style_variables["hexagonal-cluster-small-border-opacity"];
                    // font           = this.style_variables["hexagonal-cluster-small-font"];
                    // font_color     = this.style_variables["hexagonal-cluster-small-font-color"];
                }

                return {
                    weight: 5,
                    color: border_color,
                    opacity: opacity,
                    fillOpacity: opacity,
                    fillColor: color,
                };

            };

        },
        analytic_geojson_style() {
            return (feature) => {

                const layer = this.active_layers.find(l => {
                    return feature.layer_id == l.id;
                });

                const { max_total, min_total } = layer;
                const [metric_total] = Object.values(feature.properties.metric_data);

                const color = this.calcColorByMinMax(this.style_variables["analytic-geojson-small-color"],
                                                     this.style_variables["analytic-geojson-large-color"], 
                                                     min_total, 
                                                     max_total, 
                                                     metric_total);
                const border_color = this.calcColorByMinMax(this.style_variables["analytic-geojson-small-border-color"],
                                                            this.style_variables["analytic-geojson-large-border-color"], 
                                                            min_total, 
                                                            max_total, 
                                                            metric_total);

                // const border_opacity = this.style_variables["analytic-geojson-border-opacity"];
                const opacity = this.style_variables["analytic-geojson-opacity"];

                const style = {
                    weight      : 5,
                    color       : border_color,
                    opacity     : opacity,
                    fillOpacity : opacity,
                    fillColor   : color,
                };


                return style;
            };

        },
        operative_geojson_style() {
            return (feature) => {

                const layer = this.active_layers.find(l => {
                    return feature.layer_id == l.id;
                });

                const color = (layer.sh_map_has_layer_color) ? layer.sh_map_has_layer_color : '#3388ff';

                const style = {
                    color       : color,
                    fillColor   : color
                };


                return style;
            };

        },
        // Se genera una lista general de todas las capas activas
        active_layers(){
            if(_.isEmpty(this.layers)){ return []}
            let active_layers_raw = []

            active_layers_raw = active_layers_raw.concat(this.working_layers.filter( l => l.active));

            let active_layers_keys = active_layers_raw.map( lr => lr.key );

            let active_layers = Object.values(this.layers).filter( l => active_layers_keys.includes(l.id));

            return active_layers;
        },
        disabled_layers(){
            if(_.isEmpty(this.layers)){ return []}
            let active_layers_ids = this.active_layers.map(l=> l.id);
            let disabled_layers =  Object.values(this.layers).filter( l => !active_layers_ids.includes(l.id));
            return disabled_layers;
        }
    },
    watch:{
        analytic_cluster() {
            this.analytic_cluster_initial_zoom = this.zoom;
        },
        zoom(newZoom){
          if(this.analytic_cluster_initial_zoom !== undefined)
            this.should_hide_cluster_labels = newZoom < this.analytic_cluster_initial_zoom - 1;
        },
        active_layers: {
          handler() {
            this.switchLayers();
          },
          deep: true
        },
        active_filters: {
          handler() {
            this.switchLayers();
          },
          deep: true
        },

    },
    created(){
        
        // TO DO:
        // Colocar primera capa base encontrada

        //Alguna parte del mar del Pacifico Sur
        this.center = [-45.7247315, -108.8552016];

        this.getMapConfiguration();
        // Cuando geo_json es construido, se instancia Supercluster

    },
    mounted(){
        this.poweredCoderhub();
    },
    methods:{
        zoomToLocation(latLng){
            this.searchMarkerLatLng = latLng;
            this.shouldShowSearchMarker = true;
            this.map.flyTo(latLng, 16);
        },
        zoomMap(zoom){
            if(zoom === "out") this.zoom--;
            else if(zoom === "in") this.zoom++;
            else this.zoom++;
            
            if(this.zoom > 18) this.zoom = 18;
            if(this.zoom < 0) this.zoom = 0;
        },
        ready(){
            this.setTileLayer();
            this.map = this.$refs.my_map.mapObject;
            const resizeObserver = new ResizeObserver(() => {
                this.map.invalidateSize(false);
            });
            resizeObserver.observe(this.$refs.map_container);
        }, 
        filter(){
            this.findBounds();
        },  
        switchLayers(){
            
            // Recalculamos siempre las operative_geoserver_wms activas
            this.operative_geoserver_wms = [];

            this.active_layers.forEach(l => {
                this.activeLayers(l);
            });
            
            this.disabled_layers.forEach(l => {
                this.disableLayers(l);
            });
            
        }, 
        activeLayers(layer){

            let geojson_bounds = this.getMapGeoJsonBounds();

            switch(layer.sh_map_has_layer_code){
                case 'analytic_geojson' : {
                    // eslint-disable-next-line
                    const {is_empty,is_new_layer}= this.organizeLayers(layer, this.analytic_geojson_list);

                    if (!is_new_layer) {
                        this.analytic_geojson_list = this.cleanGeojsonLayer(layer, this.analytic_geojson_list);
                    }

                    this.getAnalyticalGeoJson(layer);
                    break;

                }
                case 'analytic_cluster' : {
                    let if_empty           = (_.isEmpty(this.analytic_cluster)) ? true : false;
                    let if_diferent_bounds = (!_.isEmpty(this.analytic_cluster) && (this.analytic_cluster.bounds).join() != (geojson_bounds).join()) ? true : false;

                    if(if_empty || if_diferent_bounds){
                        this.getAnalyticalClusterGeoJson(layer);
                    }
                    break;

                }
                case 'analytic_countour_map' : {
                    let if_empty           = (_.isEmpty(this.analytic_countour_map)) ? true : false;
                    let if_diferent_bounds = (!_.isEmpty(this.analytic_countour_map) && (this.analytic_countour_map.bounds).join() != (geojson_bounds).join()) ? true : false;

                    if(if_empty || if_diferent_bounds){
                        this.getAnalyticalCountourMap(layer);
                    }
                    break;

                }
                case 'base_google_map' : {
                    this.base_google_map = layer;
                    break;

                }
                case 'base_map_guide' : {
                    this.base_map_guide = layer;
                    break;

                }
                case 'base_open_street_map' : {
                    this.base_open_street_map = layer;
                    break;

                }
                case 'operative_geoserver_wms' : {
                    this.operative_geoserver_wms.push(layer)
                    break;

                }
                case 'operative_geoserver_wfs_point': {
                    const {is_empty,is_new_layer} = this.organizeLayers(layer, this.operative_geojson_list);

                    // Finalmente se agrega una capa si operative_geojson_list está vacía o si tiene otras capas pero no continene a layer (Es decir si es una nueva capa)
                    if(is_empty || (!is_empty && is_new_layer)){
                        this.requestGeoJson(layer, this.operative_geojson_features)
                        .then(() => {
                            this.getOperativeGeoJson(layer);
                        });
                    }

                    break;
                }
                case 'supercluster': {
                    // La capa supercluster se activa mediante el atributo "visible" enviado al componente SuperclusterLayer
                    break;
                }
                default:{
                    console.log('Intento de activar '+layer.sh_map_has_layer_code+' sin exito. ' + '('+layer.sh_map_has_layer_name+')');
                    break;
                }

            }

        }, 
        disableLayers(layer){
            
            switch(layer.sh_map_has_layer_code){
                case 'analytic_geojson' : {
                    //Filtra un elementos inactivo de analytic_geojson segun layer dejando solo los elementos activos
                    this.analytic_geojson_list = this.cleanGeojsonLayer(layer, this.analytic_geojson_list);
                    break;
                }
                case 'analytic_cluster' : {
                    this.analytic_cluster = undefined;
                    break;

                }
                case 'analytic_countour_map' : {
                    if (!_.isEmpty(this.analytic_countour_map)) {

                        this.analytic_countour_map = undefined;
                        
                        this.makeEmptyHeatmap();
                    }
                    break;
                }
                case 'base_google_map' : {
                    this.base_google_map = undefined;
                    break;

                }
                case 'base_map_guide' : {
                    this.base_map_guide = undefined;
                    break;

                }
                case 'base_open_street_map' : {
                    this.base_open_street_map = undefined;
                    break;

                }
                case 'operative_geoserver_wfs_point': {
                    //Filtra un elementos inactivo de analytic_geojson segun layer dejando solo los elementos activos
                    this.operative_geojson_list = this.cleanGeojsonLayer(layer, this.operative_geojson_list);

                    break;
                }
                case 'supercluster': {
                    // La capa supercluster se desactiva mediante el atributo "visible" enviado al componente SuperclusterLayer
                    break;
                }
                default:{
                    //console.log('Intento de desactivar '+layer.sh_map_has_layer_code+' sin exito. ' + '('+layer.sh_map_has_layer_name+')');
                    break;
                }

            }

        },      
        getAnalyticalCountourMap(layer){
            let h3_zoom        = this.calculateH3ZoomContour();
            let query_params   = this.makeCubeQueryParameters(layer,["h3r".concat(h3_zoom)]);
            let url            = query_params.url;
            let body           = query_params.body;
            let geojson_bounds = this.getMapGeoJsonBounds();

            axios.post(url, body).then(response => {
                let all_cubes = response.data.content;
                let data      = _.first(Object.values(all_cubes.data))     || [];
                let data_map  = _.first(Object.values(all_cubes.data_map)) || [];

                if (Array.isArray(data) && data.length>0) {

                    let data_map_hex = data_map.map(d => {
                        if (d == "h3r".concat(h3_zoom)) {
                            return 'h3';
                        }
                        return 'total';
                    });

                    let key_count        = data_map_hex.indexOf("total");
                    let key_dimension    = data_map_hex.indexOf("h3");
                    let h3_indexes_data  = data;
                    
                    let data_lat_lng = this.h3ToLngLat(h3_indexes_data,key_dimension,key_count);
                    let contour_data = {
                      max: 4000,
                      data: data_lat_lng
                    };

                    this.heatmapLayer.addTo(this.map);
                    this.heatmapLayer.setData(contour_data);
                    this.analytic_countour_map = {bounds : Object.freeze(geojson_bounds)};

                }else{
                    this.makeEmptyHeatmap();
                }
            });

        },      
        getAnalyticalClusterGeoJson(layer){
            let polygon; 
            let geojson_bounds = this.getMapGeoJsonBounds();
            let h3_zoom       = this.calculateH3Zoom();
            let query_params  = this.makeCubeQueryParameters(layer,["h3r".concat(h3_zoom)]);
            let url           = query_params.url;
            let body          = query_params.body;
            
            axios.post(url, body).then(response => {
                let all_cubes = response.data.content;
                let data      = _.first(Object.values(all_cubes.data)) || {};
                let data_map  = _.first(Object.values(all_cubes.data_map)) || {};

                let key_dimension    = data_map.indexOf("h3r".concat(h3_zoom));
                let h3_indexes_data  = data; 

                let h3_indexes = data.map(d => {
                    return d[key_dimension];
                });

                let data_map_hex = data_map.map(d => {
                    if (d == "h3r".concat(h3_zoom)) {
                        return 'h3';
                    }
                    return 'total';
                });


                polygon        = this.asPolygon(null,this.h3ToFeature(h3_indexes,h3_indexes_data,data_map_hex));
                this.analytic_cluster = {geo_json : polygon, bounds : Object.freeze(geojson_bounds)};
            });

        },
        getAnalyticalGeoJson(layer){
            this.should_skip_bounds_filter = true;
            const dimension_ids = [layer.sh_map_has_layer_dimension_id_reference];
            const query_params  = this.makeCubeQueryParameters(layer,dimension_ids);
            const url           = query_params.url;
            const body          = query_params.body;

            if (!(Object.prototype.hasOwnProperty.call(this.analytic_geojson_features,layer.id))) {
                this.requestGeoJson(layer, this.analytic_geojson_features, url, body)
                .then(() => {
                    this.getAnalyticalGeoJsonBi(layer, url, body);
                });

            }else{
                this.getAnalyticalGeoJsonBi(layer, url, body);
            }
        },
        getAnalyticalGeoJsonBi(layer, url, body){
            axios.post(url, body).then(response => {
                let all_cubes = response.data.content;
                let data      = _.first(Object.values(all_cubes.data)) || {};
                let data_map  = _.first(Object.values(all_cubes.data_map)) || {};

                //Conseguir lista de códigos de identificación
                let key_code_dimension  = data_map.indexOf(layer.sh_map_has_layer_dimension_col_reference);

                layer.total_dimension_ref = data_map.find((dm, key) => {
                    if (key != key_code_dimension) return dm
                });

                const key_total_dimension = data_map.indexOf(layer.total_dimension_ref);
                const total_list = data.map(d => { return d[key_total_dimension]; });
                
                const max_total = (total_list.length > 0) ? Math.max(...total_list) : 0;
                const min_total = (total_list.length > 0) ? Math.min(...total_list) : 0;
                
                layer.max_total = max_total;
                layer.min_total = (max_total != min_total) ? min_total : 0;
                
                //Relacionar el total de data con feature
                const code_id_list = data.map(d => { return d[key_code_dimension]; });
                const features = this.analytic_geojson_features[layer.id].map(feature => {
                    // Aquí se busca el la coincicencia entre feature y data
                    const geojson_col_reference = feature.properties[layer.sh_map_has_layer_geojson_col_reference];
                    
                    // Se busca el indice de la coincidencia usando una "loosy comparison"
                    // Esto para evitar problemas con los tipos de datos. Ejemplo: 1 == "1" => true
                    const index_dimension = Object.keys(code_id_list).find( i => code_id_list[i] == geojson_col_reference);

                    //Si el indice es encontrado se agrega su valor si no se deja el valor en null1
                    const total = (index_dimension !== undefined)
                        ? data[index_dimension][key_total_dimension]
                        : null;

                    feature.properties.metric_data = {
                        [layer.total_dimension_ref] : total
                    };
                    feature.layer_id = layer.id;
                    return feature; 
                });

                let geojson  = {
                    "layer_id" : layer.id,
                    "geojson"  : {
                        "type"     : "FeatureCollection",
                        "features" : features
                    }
                };

                this.analytic_geojson_list.push(geojson);
                    

            });
        },
        getOperativeGeoJson(layer){

                //Relacionar el total de data con feature
                let features = this.operative_geojson_features[layer.id].map(feature => {

                    feature['layer_id'] = layer.id;

                    return feature; 
                });

                let geojson  = {
                    "layer_id" : layer.id,
                    "geojson"  : {
                        "type"     : "FeatureCollection",
                        "features" : features
                    }
                };


                this.operative_geojson_list.push(geojson);
        },
        requestGeoJson(layer, feature_container){
            return axios.get(layer.sh_map_has_layer_url)
                .then((response) => {
                    let raw_data;
                    if (typeof response.data === 'object' && response.data !== null) {
                        raw_data = response.data;
                    }else{//Si data no recibe un objeto
                        const regex_numeric = /(?<=\[\s*|:\s*|,\s*)(NaN|Infinity)(?=\s*,|\s*]|\s*})/gm;
                        const regex_text    = /(?<=\[\s*|:\s*|,\s*)([A-Za-zÀ-ÿ\s]*?)(?=\s*,|\s*]|\s*})/gm;

                        let info = response.data;
                        info = info.replaceAll(regex_numeric, 0);
                        info = info.replaceAll(regex_text, '"$1"');

                        try{
                            raw_data = JSON.parse(info);
                        }catch(e){
                            console.warn(e);
                            raw_data = {};
                        }
                    }
                    
                    feature_container[layer.id] = raw_data.features;

                });
        },
        cleanGeojsonLayer(layer, layer_geojson_list){
            // Desactiva la capa actual en layer
            let layer_geojson_active_list = layer_geojson_list.filter( layer_geojson => {
                if (layer_geojson.layer_id != layer.id) {
                    return layer_geojson;
                }
            });

            return layer_geojson_active_list;
        },
        getMapGeoJsonBounds(){
            let bounds         = this.map.getBounds();
            let geojson_bounds = [
                [bounds._northEast.lng, bounds._northEast.lat],
                [bounds._southWest.lng, bounds._northEast.lat],
                [bounds._southWest.lng, bounds._southWest.lat],
                [bounds._northEast.lng, bounds._southWest.lat]
            ];

            return geojson_bounds;
        },
        makeCubeQueryParameters(layer,columns_dimension_ids){
            const url           = this.base_url+layer.sh_map_has_layer_bi_url;
            const filters       = this.formatFilter();
            const dimension_ids = columns_dimension_ids;
            const {metric, calculation} = this.metricFilter(layer);

            let body          = {
                calculation   : calculation,
                metric_id     : metric, // Viene de la configuracion de la capa (mapa tiene capas)
                filters       : filters, // Son los active_filters formateados
                dimension_ids : dimension_ids,
            };

            let query_parameters = {
                url  : url, 
                body : body
            };

            return query_parameters;
        },
        makeEmptyHeatmap(){

            this.heatmapLayer.addTo(this.map);
            let contour_data = {
              max: 4000,
              data: []
            };

            this.heatmapLayer.setData(contour_data);

        },
        formatFilter(){
            if (_.isEmpty(this.active_filters) && _.isEmpty(this.bounds_filters)) {
                this.findBounds();
            }
            // Se utiliza copia de active_filters para no modificar el original
            let active_filters = (_.isEmpty(this.active_filters)) ? this.bounds_filters : _.cloneDeep(this.active_filters);

            if (this.should_skip_bounds_filter) {

                active_filters = active_filters.filter(a_f => a_f.column.id != this.col_lat && a_f.column.id != this.col_lng);
                
                this.should_skip_bounds_filter = false;
            }

            let filters = active_filters.map(a_f => {

                if(a_f.type == 'EQUAL'){
                    a_f.type = 'IN';
                    a_f.search = [a_f.search];
                }

                if (typeof a_f.type === 'undefined'){
                    a_f.type = 'IN';
                }

                let filter = {
                    column : a_f.column.col_name,
                    value  : a_f.search,
                    type   : a_f.type,
                };
                return filter;
            });

            return filters;
        },
        metricFilter(layer){
            let metric      = layer.sh_map_has_layer_metric_id;
            let calculation = layer.sh_map_has_layer_calculation;
            if (!_.isEmpty(this.active_filters)) {
                //Buscamos en los filtros activos un filtro de tipo metric
                const new_metric = this.active_filters.find((filter) => {
                    return filter.type == "METRIC";
                });

                metric      = (new_metric) ? new_metric.search : metric;
                calculation = (new_metric) ? null              : calculation;
            }

            return {'metric':metric,'calculation':calculation};
        },
        calculateH3Zoom(){
            const h3Zoom = (() => {
                switch (this.zoom) {
                case 1:
                case 2:
                case 3:
                    return 1;
                case 4:
                    return 2;
                case 5:
                case 6:
                    return 3;
                case 7:
                    return 4;
                case 8:
                case 9:
                    return 5;
                case 10:
                    return 6;
                case 11:
                case 12:
                    return 7;
                case 13:
                    return 8;
                case 14:
                    return 9;
                case 15:
                case 16:
                    return 10;
                case 17:
                    return 11;
                case 18:
                    return 12;
                default:
                    return 1;
                }
            })();
            return h3Zoom - 1;
        },
        calculateH3ZoomContour(){

            var zoom = this.map.getZoom();
            var h;
            switch (zoom) {
                case 1:
                case 2:
                case 3:{
                    h = 1;
                    break;
                }
                case 16:
                case 17:
                case 18:{
                    h = 15;
                    break;
                }
                default:{
                    h = zoom;
                    break;
                }
            }
            return h;
        },

        setTileLayer(){
            this.url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        },
        getMapConfiguration(){
            //data
            const url = `${this.base_url}${this.endpoint_config}${this.config_entity_type_id}/${this.config_entity_id}?page=1&set_alias=alias`;

            let all_data;
            let data;
            axios.get(url)
            .then((response) => {
                try {
                    all_data     = response.data.content;
                    data         = _.first(all_data.data);
                    this.col_lng = data.sh_map_column_longitude;
                    this.col_lat = data.sh_map_column_latitude;

                    if (data.latitud_map_center && data.longitud_map_center) {
                        this.center = [data.latitud_map_center, data.longitud_map_center]
                    } else {
                        // Coordenadas para Santiago de Chile - Chile
                        this.center = this.center_default;
                    }
                } catch (error) {
                    console.error(error);
                    
                    // Coordenadas para Santiago de Chile - Chile
                    this.center = this.center_default;
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                console.log('done data');
            });

        },
        onMapMoveEnd(){
            this.$refs.analytic_cluster_layer.getClusterMarkers();
        },
        onMapClick(event){
          this.$refs.polygon_drafter.addPolygon(event);
        },
        findBounds(){
            if (!this.should_skip_bounds_filter) {
                this.$refs.polygon_drafter.deletePolygon();
                //let h        = this.map.getZoom();
                let bounds   = this.map.getBounds();
                let all_col  = this.info.columns;

                let bounds_filters = all_col.filter(columns=>
                    columns.id == this.col_lat || columns.id == this.col_lng
                ).map((columns,key)=>{
                    let start = (columns.id == this.col_lat) ? bounds._southWest.lat : bounds._southWest.lng;
                    let end   = (columns.id == this.col_lat) ? bounds._northEast.lat : bounds._northEast.lng;
                    let bounds_filter = {
                        "column": columns,
                        "id": "external-filter-"+columns.id,
                        "order": key+1,
                        "search": {
                            "start": start,
                            "end": end
                        },
                        "type": "BETWEEN"
                    };
                    return bounds_filter;
                });
                this.bounds_filters = bounds_filters;
            }
            this.should_skip_bounds_filter = false;
        },


        //#Convierte un indice h3 en lng lat
        h3ToLngLat(h3_indexes,key_dimension,key_count){
            let data = [];
            let point;
            let index;
            let h3_index;
            for(let i in h3_indexes){
                index = h3_indexes[i][key_dimension];
                h3_index = this.h3.h3ToGeo(index);
                point    = {
                    lat   : h3_index[0],
                    lng   : h3_index[1],
                    count : h3_indexes[i][key_count]
                }
                data.push(point);
            }

            return data;
        },
        //----------------------------------------------------------------------------------------------
        // SCRIPT DE MAURICIO
        //----------------------------------------------------------------------------------------------
        //#Obtiene todos los pentagonos de h3 de resolucion h que estan contenidos dentro de un poligono.
        //#Este incluye un nivel de vecinos para completar todos los espacios del poligono
        polyfillNeighbors(polygon, h){

            let polygons     = this.h3.polyfill(polygon, h, true);
            let indexes      = [];
            let unique_kring = {};
            let poly;
            let krings;
            let kring;

            for (let i = 0; i < polygons.length; i++) {
                poly = polygons[i];
                if (!Object.prototype.hasOwnProperty.call(unique_kring,poly)){
                    indexes.push(poly);
                    unique_kring[poly] = null;
                }
            }
            
            for (let i = 0; i < polygons.length; i++) {
                poly   = polygons[i];
                krings = this.h3.kRing(poly, 1);
                //#krings = h3.compact(krings)
                for (let j = 0; j < krings.length; j++) {
                    kring = krings[j];
                    if (!Object.prototype.hasOwnProperty.call(unique_kring,kring)){
                        indexes.push(kring);
                        unique_kring[kring] = null;
                    }
                }
            }
                
            return indexes;
        },

        getFilters(indexes){
            let filters_obj = {};
            let filters     = [];
            let index;
            let r;
            //indexes = h3.compact(indexes);
            for (let i = 0; i < indexes.length; i++) {
                index = indexes[i];
                r     = this.h3.h3GetResolution(index);
                if(!Object.prototype.hasOwnProperty.call(filters_obj,"h3r"+r)){
                    filters_obj["h3r"+r] = [];
                }
                filters_obj["h3r"+r].push(index);
            }
            for (var key in filters_obj) {
                filters.push({"column":key,"values":filters_obj[key]});
            }
            return filters;
        },

        //#Convierte una lista de Features en un FeatureCollection
        asPolygon(obj,features){
            if(obj == null){
                obj = {
                  "type": "FeatureCollection",
                  "features": []
                };
            }
            for(let i in features){
                let feature = features[i];
                obj['features'].push(feature);
            }
            return obj;
        },

        //#Convierte un arreglo de coordenadas en un objeto de tipo Feature
        asFeature(obj, coordinates, properties = {}){
            if(obj == null){
                obj = {
                    "type": "Feature",
                    "properties": properties,
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": []
                    }
                };
            }
            obj['geometry']['coordinates'].push(coordinates);
            return obj;
        },

        //#Dado un indice h3 (en hexadecimal o numérico), obtiene el pentagono que lo representa en formato feature
        getBoundary(h3_index, properties = {}){
            if (this.isInt(h3_index)){ //#si el indice es numérico, convertir a hexadecimal
                h3_index = h3_index.toString(16);
            }
            let boundaries = this.h3.h3ToGeoBoundary(h3_index);
            let res        = [];
            for(let i in boundaries){
                let boundary = boundaries[i];
                let lat = boundary[0];
                let lng = boundary[1];
                res.push([lng, lat]);
            }
            res.push(res[0]);
            return this.asFeature(null,res, properties);
        },
        /*
        //#obtiene todos los pentágonos hijos (contenidos) de un indice en h3
        getChild(h3_index){
            if(isinstance(h3_index, int)){
                h3_index = h3_index.toString(16);
            }
            childs = this.h3.h3ToChildren(h3_index);
            res = [];
            for(let i in childs){
                child = childs[i];
                res.push(this.getBoundary(child));
            }
            return res;
        },*/
        getProperties(index, h3_indexes_data, data_map_hex){
            let h3_index_data = h3_indexes_data[index];
            let h3_properties = [];

            let h3_index_properties = h3_index_data.map(function(data,key){
                let property_name             = data_map_hex[key];
                let property_value            = data;

                return {'property_name' : property_name,'property_value' : property_value};

            });

            h3_index_properties.forEach(function(data){
                h3_properties[data.property_name] = data.property_value;
            });

            return JSON.parse(JSON.stringify(Object.assign({}, h3_properties)));
        },
        //#Convierte un indice h3 en un objeto de tipo Feature
        h3ToFeature(h3_indexes,h3_indexes_data,data_map_hex){
            let features = [];
            let index;
            let properties;
            for(let i in h3_indexes){
                index = h3_indexes[i];
                properties = this.getProperties(i, h3_indexes_data, data_map_hex);
                features.push(this.getBoundary(index,properties));
            }
            return features;
        },
        // END SCRIPT DE MAURICIO 
        //----------------------------------------------------------------------------------------------
        // Helpers
        //----------------------------------------------------------------------------------------------
                // format text with "_" to text legible for humans,
        // set all on lowercase but first letter to uppercase and each after "_" or " " to uppercase,
        // separe letter from numbers
        formatKeyToHumanText(text){
            let textFormated = text.replace(/_/g, " ");
            textFormated = textFormated.toLowerCase();
            textFormated = textFormated.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
            textFormated = textFormated.replace(/([a-z])([0-9])/i, '$1 $2');
            textFormated = textFormated.replace(/([0-9])([a-z])/i, '$1 $2');
            return textFormated;
        },
        // calc hexadecimal between two colors by ratio (0.0 - 1.0)
        calcColor(color1, color2, ratio){
            const hex = function(x) {
                if(x > 255) x = 255;
                x = x.toString(16);
                return (x.length == 1) ? '0' + x : x;
            };
            const r = Math.ceil(parseInt(color1.substring(1,3), 16) * ratio + parseInt(color2.substring(1,3), 16) * (1 - ratio));
            const g = Math.ceil(parseInt(color1.substring(3,5), 16) * ratio + parseInt(color2.substring(3,5), 16) * (1 - ratio));
            const b = Math.ceil(parseInt(color1.substring(5,7), 16) * ratio + parseInt(color2.substring(5,7), 16) * (1 - ratio));
            const calc = '#' + hex(r) + hex(g) + hex(b);
            return calc;
        },
        // calc hexadecimal between two colors by min and max values
        calcColorByMinMax(color_min, color_max, min, max, value) {
            if (max == min) {
                 return color_min;
            }
            if (value == null) {
                value = 0;
            }
            const ratio = (max - value) / (max - min);
            return this.calcColor(color_min, color_max, ratio);
        },
        isJson(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        },
        isInt(value) {
            return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
        },
        // Enlistar capas geojson
        organizeLayers(layer, layer_list) {
            // Analytic_geojson y operative_geoserver_wfs_point son un tipo de capa que 
            // permite tener a la vez varias capas de su mismo tipo
            // pero cada una de sus capas puede puede activarse o desactivarse solo una vez por intancia
            // Ejem si tenemos una capa de este tipo denominada X, no puede duplicarse 
            const is_empty   = (layer_list.length < 1) ? true : false;
            let is_new_layer = false;
            // Si la lista de capas no está vacía se revisa si la Layer a activar fue activada previamente
            if (!is_empty) {
                const layer_ids = layer_list.map(function(layer_l){
                    return layer_l.layer_id
                });
                //determina si ya existe la capa en la lista
                is_new_layer = !layer_ids.includes(layer.id);

            }

            return {'is_empty':is_empty,'is_new_layer':is_new_layer};
        },
        infoGeojsonWithAlias(layer, property_keys) {
            //Si sh_map_has_layer_property_keys tiene configuraciones procesamos las propiedades
            let info = Object.entries(property_keys).map(([key, property]) => {
                let value = null;
                if(key.includes('.')){
                    /* Busca hacia adentro cada propiedad separada por `.`
                    * Ejemplo:
                    * "key.prop1.key2" => layer.feature.properties['key']['prop1']['key2']
                    */
                    let keys = key.split('.');
                    value = layer.feature.properties;
                    for(let i in keys){
                        if(keys[i] == '*' && value != null && typeof value == 'object'){
                            [value] = Object.values(value);
                            continue;
                        }
                        value = value[keys[i]];
                        // Si es asterisco, tomamos todos los valores
                    }
                }else{
                    value = (layer.feature.properties[key] == null) ? 'Sin información disponible' : layer.feature.properties[key];// parseamos el valor resultante
                }

                // Para soportar alias de mulitples metricas
                // y que no nos aparezca una lista de metricas vacias,
                // ignoramos las metricas no encontradas
                if (value == null && key.includes('metric_data')) {
                    return null;
                }
                value = isNaN(value) ? value : value.toLocaleString('es-ES'); // Si el valor resultante es un número nos aseguramos que quede puntuado

                return `
                    <span class="marker-pop-up-info-title"> <b>${property} : </b> </span> 
                    <span class="marker-pop-up-info-content"> ${value} </span>
                `;
            }).filter( i => i);

            return info;
        },
        //Se le retorna toda la informacion de las properties existentes al usuario la cual puede venir con keys amigables
        //o puede retornarse justo como la presenta el GeoJson
        infoGeojsonWithKeys(layer, human_keys) {
            let info = Object.entries(layer.feature.properties).map(([property,value]) =>{
                // Deconstruímos las propiedades reservadas
                if(property === 'metric_data'){
                    /* Ejemplo de contenido la variable `value` cuando la property es `metric_data`:
                     * {'total_casos': 387.123}
                     */
                    [[property, value]] = Object.entries(value)
                }
                let title = (human_keys) ? this.formatKeyToHumanText(property) : property; // Tomamos la clave de la propiedad
                value = (value == null) ? 'Sin información disponible' : value; // parseamos el valor resultante
                value = isNaN(value) ? value : value.toLocaleString('es-ES'); // Si el valor resultante es un número nos aseguramos que quede puntuado
                return `
                    <span class="marker-pop-up-info-title"> <b>${title} : </b> </span> 
                    <span class="marker-pop-up-info-content"> ${value} </span>
                `;
            });

            return info;
        },
        // END HELPERS
        polygonAction(action) {
            switch (action) {
                case 'draw': {
                    this.$refs.polygon_drafter.draw();
                    break;
                }
                case 'delete': {
                    this.$refs.polygon_drafter.deletePolygon();
                    break;

                }
            }

        },
        polygonFilter(bounds_filters) {
          this.bounds_filters = bounds_filters;  
        },
        poweredCoderhub() {
             // Getting Open Street Map attribution container
            const poweredByOpenStreetMap = document.querySelector('.leaflet-bottom.leaflet-right');
            poweredByOpenStreetMap.style.display = "flex";
            // Creating Coderhub powered by container
            const poweredByCoderhubDiv = document.createElement('div');
            poweredByCoderhubDiv.classList.add("leaflet-control-attribution");
            poweredByCoderhubDiv.classList.add("leaflet-control");
            // Creating Coderhub logo
            const poweredByCoderhubImg = document.createElement('img');
            poweredByCoderhubImg.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI0OHB4IiBoZWlnaHQ9IjQ4cHgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgNDggNDgiIHhtbDpzcGFjZT0icHJlc2VydmUiPiAgPGltYWdlIGlkPSJpbWFnZTAiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgeD0iMCIgeT0iMCIKICAgIGhyZWY9ImRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBREFBQUFBd0NBWUFBQUJYQXZtSEFBQUFCR2RCVFVFQUFMR1BDL3hoQlFBQUFDQmpTRkpOCkFBQjZKZ0FBZ0lRQUFQb0FBQUNBNkFBQWRUQUFBT3BnQUFBNm1BQUFGM0NjdWxFOEFBQUFCbUpMUjBRQS93RC9BUCtndmFlVEFBQUkKMUVsRVFWUm8zdFdhZTNCVTFSM0h2K2MrOXBITlpuZXpTU0FrQVJJZVFSRENRMEFvQlFFRmNkVHFXSVJDQStKYk95MFViV3ZINTlqVwpka1p0Nitob0d6RHFKQ3BVUUtuZ0F3VkZ5Nk9CQUZZZ0lTRkFDQW1FWk4vM3NmZDFUdjhJd1R5VUxCSkQ4cDNabmJtL1BmZDN6dWYrCjd2MmQzN2xuZ2N1ZzRRLy9mczYwcDU5Sjd3NWZ3dVVBQ0VpeEtSYWxiZ0RyTDlVWDE5T0RaNHh4QU1sdWxtTExDbDhwY3ZjNUFBQ0MKS1BCSmNseWJzZnZvc2RsOUR1RE5uYnNFamhDWFNXbHlRSktXM0wycStKS2kwT01BTzZxT2lwWkZrOEVZb3FvNmMzdGwxU1ZGb2NjQgp2anA1VW95YmhodUV3S1RVRzVTbHdxWC9YSjNTWndBTzFUY0lpcWFmSDNCRVVXZnZxS3ErcHM4QU9FWFJabEpxYnowMktmV0VaSG5KCjk0MUNqd1BrWjJhbThoeVgzTllXVmVPemQxZlhUTzhUQUR6SFpYQ0VPTnJhRE12eU5rbXh4YTl1LzhMWjZ3SHFRNkVNeHBpOW85MHcKclZRN0wxejBlSG9jSUNqSnlaU3hUaVdNb3V0TlA1MDBVZW4xQUxwbDhvd3gwdFpHQ0lISDZRdzViQ0xyOVFDVU1vRUI3UUVBOVBPawpuUDQrL25vY2dPT0lENnpUaGFaMlFUalRKd0JFWGtqK2x2dUVLcm9ldUdTQVArOHU1eFp2MnVMNnkzL0wrUjlpOEl3eHdTR0t2azZECjRJZ2hhMW9VQUpZVkZmdVdGUlU3RXZYWkxodGt1MTNpWnlkUDNmYlN2cS96aHEwcStYSlFpdnZBcnlhTWlkdzhOTS9zRG9Ebk5uOGsKTXNaU093RVFvbExLSkFEWWV1anc5R1NIWFFLd05SR2Y3U0pRT0dxRXhoR3lUVFBOa2JYUjJOcXkwMmMzMy9uaHRtZEhySDd6cHFtbAo2N0orOS9sTzI2VUFyTjlUYnBNMHpkL1JMdktDbk9OUFZSaGpSRGZOZVkyUnlJSU5aWHNUV2kyU2J6Tk9LdmxYYmtVZzlBOUpONjVqCkFCRTRUckx6ZksyTjUzWm11bHhiUlk3Yk42RmZlbDN4RGJQakZ3UGdXSFp2bW02YTJ5aGpvOXZhUFU3bmdYdG1UcCszc2Z4QXJDNFkKM0FJZ2U5eWdnVGZ0ZXVxeC8xMVVCRnBWVm5qNzhUeVBaNlZMRk1zQXdLUTBXVGFNVWVHNGRzK1JVT2kxeW1EbzR3M1Z4NHJ5VjVmZQpNN1NvcE9DQkxaOG5KUUtRNWZQYUFIUnFxeHJHbVp6VTFPQlZlWVBUQ0pDaG0rYkF1bUJ3WGlJK3Z6TUxmYlZzNGFGaFB1L0tKRUdvCmFMVXhBQlpsVHMyeWNzT2FWbGdkaXJ4Y0c0MTk5RlpGMWV0RGlrb2VHdm5xbTFPWGJ2N2tPMWRZK1ptWkhvSG5PdFU3SENIQjVkZlAKMFN2cVR3OW1nSjh5aGtCTStrbmV5dC82MElVdWVKL3R2MlBCem9MWDNuNmtLaFI1UVRYTndSMS9wNHdKbExIK0VVMmZIOU9OMjNoQwpRblV4YVUvT0s2K1hPVVhocytuWkE3NmVuejhrT0RkM0VEczNVQTlIT0J0Z25mZEJDRUc2MjkxY0I2QStGTXJUVE5NREFKcHBlaHBDCjRTNmZneTduZ1FOM0xIdy96ZWw0VXVTNEMwNDBsREhPb05RZjA0M3JUOFdreDQrSG8rK3VyYXpldFBTRHJjOFBMU3FaVzdobGUvOXcKUE81bllKMFNnZHZwQ0RER2lNTW1UbXg1YXdGNGtwS2FwZzBmcGw4eUFDR0UzVFJrVUtuYkp2NkpKeVRhVlhzQVlBQXhLUFhHZE9QcQpSbGxaVVJ1TnZiUHVVTVZIQjRqdFVaUHduWEk4UjBoZ3c1NjlRbGhXQnJiYWtteTJFLzlldWJ6TDRpNmhtZmpsT1RQcG9pdnlWMlc2CmtwNXhDUHd4bnBBNFNlVEViMkRjcW1FV1NJSTR4Zko0MjBlQU1SYUx4NE03cW8rbVdwU2VCNGlwNnZFa3U4M29GZ0FBZU9tNjZkcUsKcXdyK05pTFZOeWMvMVh0WHF0UHhiTEpOTEJNNExzZ1RZaVhraEJBZ05RMXdPRnZRV3I3MStsQzRhV1A1L2lFbXBUbm5Jc0lFbmsrbwp0TGlvVjRzUFR4cXZBNmdCVUJOUzQydm1yZC9rWjR5TnJJdEpZMlREbUtFWTVuZ0EvUTFLdjN0bFpYY0EvblNnb1E3bmlqcG1Gd1NtCm05WVEzVFJUQUlEak9NdnJTbEtDM1EzUVZqNm5nd0pvQXJBZHdQWlphOTU5VlRITXJMQ21qV2xTNGxObDA1akpHQWJxbFBwYUg4enoKOHZxQVNCaUlSVUFJc1dXa3VDZHpoRXNuQU1kYUlxQ251OTNCWXo4a1FGczkvdVZ1RndHc3AzOThkVFdBNmh2WGIzb3ZxTWE5REJoKwpJaEtib2xubU5ZcGhEak1ZemJVb3M0TVhnTFFNUUpYQkxJdHJqa2wzMndUZWFxMVNHV09LeTI2dlQ2VHZiZ0ZvVXVLNUg1ODRXWmoyCjRtcHpZSXI3NEtIbTRORlVoejF3YjhISUEvZU5IYjFyK2RZdlhxcU5TUDMyblQwN2tUTE1ibGJWbStQSjdteDRmRUN3R1pLbTVVTDcKeHA5RmFmVGdxZnJHUlBwT05KbGNVTy9Ybk9BZS9XTFhyVFhoeUhPcWFlWHdoRVR0UEI4RVFhV2Q0NnV6M2E3cVpqVmV3eEhTc0h6QwptUHJTdzFYWEhnbUZuMWVqMFd6VTFnQjYrM1NmNG5UdXplL2YvNFk5ZjNpaXFVY0FBSUF4UnNhOXNmYVdJOEh3WDl2TzJnUXRjd2xqClRCZDVMc0lUN21DeUtKeXdHSDRVak1memNmWTBjS2FobmE5TXIrZjlwMjY5NVdmM3piNUc3cXJmYmx1UkVVTFlxcmt6Tnc3M2VYL2oKRW9XajNMblV5Z0JReGdnRDdMcEZNMVRUbk5Xc3h1OE14dVA1QUFDZkgwaHlvVFd0QW9CSmFlRGVXVE8wUlBydDFoMmFpWm45NlAwZgpmL2Fld0pIS3FLNVBPNnVvVXhuRFdNVTBzaXpHZkl5MVJMemRrbEswdGN3TnF0S2FWc0VveS9oMXlWc09BRktYRjY0N0FUcXE1TkFSClcvSFhoOVByWS9MZ1psVzlGc0Q0dUdtTjBDd3J5MkxNZGI2aFpRRjF4MXRTS3lHdzhmenhLM095NSszNzQxTkhlalFDSFZVNEtsOEgKVUgvdXMrUDVzdjJ1a3NPVmFXRk5ueHlLYTVNRmpoc1QxZlFSRmlHWjFKL0JRNVlCeXdRRE1oVk5Hdy9nOGdKMDFFT1R4c2tBWkFDMQpqTEYxU3paL21sd1JDQTArSlVtRkFlQU93K3RMUTZBSkpxV09nQ1FQVGNUbkQzb0xKYW9KYjZ5MVNhWjE0Nmt6Wng1VGpsV1BaWEdWCmVGeXVIUk5Iajc3OTAxL2UzM0NoY3kvSEpsOG5sUzlkb0IrNWE5R0dVUU56ZnU3Mys5Y1Nqak5pdWo2NUlpb3RmNlQ4NEFXWHE3MEMKb0ZWbGhmTVBUOG9hc05KbHQzOUNMVXRvbE9UN1MvZnNXOWhuQUFEZ2crVVBudTd2U1huQnhuRk5scUtrTk12eUUxY1d2ejJyendBQQp3STFqQzdaN2twd2JiSEswMGMzaFA0MktzbUpLNmJwaGZRYmc3NFdMdEFFKzN5cTNJRlNPczdRWGZRN0htak95c21oSzZUdWQvbC9SCkt3RUFZTTB2SHRqdlMzWjlXTlBRTUtEcTdzVnYrWjJPOXdyUzA0WjIzRnZvdFFCWFpHWFNiSjl2Ylc1NnV2Tys0amZFdlV0dS8ycE0KZXRxK0xjZFB0bXZYYXdFQTRNbGJiem5wc3RzUE5vWWpQQUE4T0g2ME5qZHZVTHRTNnYvV3RmMERCaXNZVGdBQUFDVjBSVmgwWkdGMApaVHBqY21WaGRHVUFNakF5TWkweE1pMHlNVlF4TkRvek5qb3dNeXN3TURvd01MSHBGS2dBQUFBbGRFVllkR1JoZEdVNmJXOWthV1o1CkFESXdNakl0TVRJdE1qRlVNVFE2TXpZNk1ETXJNREE2TUREQXRLd1VBQUFBS0hSRldIUmtZWFJsT25ScGJXVnpkR0Z0Y0FBeU1ESXkKTFRFeUxUSXhWREUwT2pNMk9qQXpLekF3T2pBd2w2R055d0FBQUFCSlJVNUVya0pnZ2c9PSIgLz4KPC9zdmc+Cg==';
            poweredByCoderhubImg.alt = "coderhub-logo.base64"
            poweredByCoderhubImg.style.marginRight = "2px"
            poweredByCoderhubImg.width = "20"
            poweredByCoderhubImg.height = "16"
            // Creating additional text
            const poweredByCoderhubSpan = document.createElement('span');
            poweredByCoderhubSpan.innerHTML = "Powered by "
            // Creating Coderhub poweredB by link
            const poweredByCoderhubLink = document.createElement('a')
            const poweredByCoderhubLinkTextNode = document.createTextNode("Coderhub");
            poweredByCoderhubLink.appendChild(poweredByCoderhubLinkTextNode);
            poweredByCoderhubLink.title = "Coderhub";
            poweredByCoderhubLink.href = "https://www.coderhub.cl/";
            poweredByCoderhubLink.target = '_blank';
            poweredByCoderhubLink.style.paddingRight = "5px";
            // Creating separator
            const poweredByCoderhubSpanSeparator = document.createElement('span');
            poweredByCoderhubSpanSeparator.ariaHidden = "true";
            poweredByCoderhubSpanSeparator.innerHTML = "|";
            // Adding Coderhub logo
            poweredByCoderhubDiv.appendChild(poweredByCoderhubImg);
            //Add additional text
            poweredByCoderhubDiv.appendChild(poweredByCoderhubSpan);
            // Adding Coderhub link
            poweredByCoderhubDiv.appendChild(poweredByCoderhubLink);
            // Adding separator
            poweredByCoderhubDiv.appendChild(poweredByCoderhubSpanSeparator);
            // Adding before "Coderhub powered by" container to "Open Street Map attribution container"
            poweredByOpenStreetMap.insertBefore(poweredByCoderhubDiv, poweredByOpenStreetMap.firstChild);
        }
    }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .my-map {
        min-height: 60vh;
    }
    .my-map >>> .my-labels{
        background-color: transparent !important;
        border: transparent !important;
        box-shadow: none !important;
        color: white;
    }
    .my-map.hide-cluster-labels >>> .my-labels {
        display: none;
    }
    li {
        text-align: left;
        margin: 0 10px;
    }


    .my-map >>> .leaflet-popup-content-wrapper,
    .my-map >>> .leaflet-popup-tip{
        background-color: var(--sh-map-marker-pop-up-background);
        border-color : var(--sh-map-marker-pop-up-border-color);
        border-width : var(--sh-map-marker-pop-up-border-width);
        border-style : var(--sh-map-marker-pop-up-border-style);
    }

    .custom-controls {
        position: relative;
        z-index: 800;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-top: 24px;
    }

    .custom-controls .zoom-btn {
        background-color: var(--sh-map-zoom-button-background-color);
        color: var(--sh-map-zoom-button-text-color);
        border-radius: var(--sh-map-radius-multiplier);
        display: flex;
        justify-content: center;
        align-items: center;
        --size: 36px;
        width: var(--size);
        height: var(--size);
        padding: 0;
        border: none;
        font-size: 0.7rem;
    }

    /* This line delete the UKR flag in the leaflet powered banner */
    .my-map >>> .leaflet-control-attribution svg {
        display: none !important;
    }

    /* This line deletes additional padding-right of coderhub powered container after delete UKR flag */
    .my-map >>> .leaflet-right > .leaflet-control:first-child {
        padding-right: 0px;
    }
</style>
