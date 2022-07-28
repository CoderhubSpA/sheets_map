<template>
  <div id="app">
    <div class="zone zone-c">
        <SheetsMap
        ref="sheetsMap"
        :base_url="base_url"
        :id="id"
        :entity_type_id="entity_type_id"
        :config_entity_type_id="config_entity_type_id"
        :config_entity_id="config_entity_id"
        :endpoint_config="endpoint_config"
        code="map"
        :active_filters="active_filters"
        :data="data"
        :info="info"
        :config="config"
        :layers="layers"
        :analytical_layer="analytical_layer"
        :operational_layer="operational_layer"
        :base_layer="base_layer"
        :custom_styles="map_custom_styles"
        />
    </div>
    <div class="zone zone-d">
        <button class="zone-d-toggle-btn" @click="toggleZoneD()">
            <b-icon icon="gear-fill" aria-hidden="false"></b-icon>
        </button>
        <div class="zone-body">
            <SheetsMapTools
            ref="sheetsMapTools"
            :base_url="base_url"
            :id="id"
            :entity_type_id="entity_type_id"
            :config_entity_type_id="config_entity_type_id"
            :config_entity_id="config_entity_id"
            :endpoint_config="endpoint_config"
            code="map_tools"
            :active_filters="active_filters"
            :data="data"
            :info="info"
            :layers="layers"
            :custom_styles="map_tools_custom_styles"
            />
        </div>
    </div>
  </div>
</template>

<script>
import SheetsMap from "./components/SheetsMap.vue";
import SheetsMapTools from "./components/SheetsMapTools.vue";
import axios from "axios";
import _ from "lodash";
import Vue from "vue";
import {
    BootstrapVue,
    BootstrapVueIcons,
} from "bootstrap-vue/dist/bootstrap-vue.esm";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

export default {
    name: "App",
    data() {
        return {
            base_url: "http://sheetsmock.local",
            id: "f52dd8c5-6504-4601-912f-acf56ddf7ca1",
            entity_type_id: "de59f145-a291-4474-91da-7e3ec3744f4f",
            // Tipo de entidad de configuracion
            config_entity_type_id: "0482f39a-7615-47f4-9d7a-dabadcc38b38",
            // Registro de configuracion
            config_entity_id: "bbad9606-cbdd-4afa-a6f1-873a47922d62",
            // Endpoint de configuracion
            endpoint_config: "/entity/data/",
            // configuracion component sheets map tools 
            default_info :"bd478f21-43d8-4380-bad8-ecce651b9ba7",
            map_tools_custom_styles:`
                {
                    "radius-multiplier"                 : "8px"
                }
            `,
            //Los valores de color de hexagonal-cluster deben ser en formato HEX
            map_custom_styles:`
                {
                    "marker-pop-up-title-font"              : "8px 'Helvetica Neue', Arial, Helvetica, sans-serif",
                    "marker-pop-up-title-color"             : "#7EF0A6",
                    "marker-pop-up-content-font"            : "12px 'Helvetica Neue', Arial, Helvetica, sans-serif",
                    "marker-pop-up-content-color"           : "#FFFFFF",
                    "marker-pop-up-background"              : "#02220B",
                    "marker-pop-up-border-color"            : "#7EF0A6",
                    "marker-pop-up-border-width"            : "3px", 
                    "marker-pop-up-border-style"            : "solid",
                    "marker-pop-up-scroll-color"            : "#7EF0A6",
                    "marker-pop-up-scroll-color-hover"      : "#17935BA7",
                    "marker-pop-up-scroll-color-active"     : "#7EF0A6",

                    "point-cluster-small-size"              : "30px", 
                    "point-cluster-small-color"             : "rgb(106, 136, 115, 0.8)", 
                    "point-cluster-small-color-div"         : "rgb(106, 136, 115, 0.8)", 
                    "point-cluster-small-border-color"      : "#70d195", 
                    "point-cluster-small-border-style"      : "solid", 
                    "point-cluster-small-border-width"      : "3px", 
                    "point-cluster-small-font-color"        : "white",

                    "point-cluster-medium-size"             : "40px", 
                    "point-cluster-medium-color"            : "rgb(124, 108, 52, 0.8)", 
                    "point-cluster-medium-color-div"        : "rgb(124, 108, 52, 0.8)", 
                    "point-cluster-medium-border-color"     : "#dee07c", 
                    "point-cluster-medium-border-style"     : "solid", 
                    "point-cluster-medium-border-width"     : "3px", 
                    "point-cluster-medium-font-color"       : "white",

                    "point-cluster-large-size"              : "60px", 
                    "point-cluster-large-color"             : "rgb(116, 36, 38, 0.8)", 
                    "point-cluster-large-color-div"         : "rgb(116, 36, 38, 0.8)", 
                    "point-cluster-large-border-color"      : "#d14d4a",
                    "point-cluster-large-border-style"      : "solid",
                    "point-cluster-large-border-width"      : "3px",
                    "point-cluster-large-font-color"        : "white",
                                                            
                    "hexagonal-cluster-small-color"         : "#6a8873",
                    "hexagonal-cluster-small-opacity"       : 0.6,
                    "hexagonal-cluster-small-border-color"  : "#70d195",
                    "hexagonal-cluster-small-font"          : "12px 'Helvetica Neue', Arial, Helvetica, sans-serif",
                    "hexagonal-cluster-small-font-color"    : "white",
                    "hexagonal-cluster-medium-color"        : "#7c6c34",
                    "hexagonal-cluster-medium-opacity"      : 0.6,
                    "hexagonal-cluster-medium-border-color" : "#dee07c",
                    "hexagonal-cluster-medium-font"         : "12px 'Helvetica Neue', Arial, Helvetica, sans-serif",
                    "hexagonal-cluster-medium-font-color"   : "white",
                    "hexagonal-cluster-large-color"         : "#742426",
                    "hexagonal-cluster-large-opacity"       : 0.6,
                    "hexagonal-cluster-large-border-color"  : "#d14d4a",
                    "hexagonal-cluster-large-font"          : "12px 'Helvetica Neue', Arial, Helvetica, sans-serif",
                    "hexagonal-cluster-large-font-color"    : "white"

                }
            `,
            data              : {},
            info              : {},
            config_data       : {},
            config_info       : {},
            layers_info       : {},
            analytical_layer  : [],
            operational_layer : [],
            base_layer        : {},
            active_filters    : []
        };
    },
    components: {
        SheetsMap,
        SheetsMapTools,
    },
    computed:{
        config_url(){
            let url;
            
            if(
                this.endpoint_config
                && this.config_entity_type_id
                && this.config_entity_id
            ){
                url = `${this.base_url}${this.endpoint_config}${this.config_entity_type_id}/${this.config_entity_id}?page=1&set_alias=alias`;
            }
            return url;
        },
        layers(){
            let layers = {}
            // Si estos datos no estan vacios
            if(!_.isEmpty(this.config_data) && !_.isEmpty(this.config_info) && !_.isEmpty(this.layers_info) ){
                
                const layers_column = this.config_info.columns.find( c => c.alias == 'sh_map_layers')
                const layers_raw = this.config_data.pivots[layers_column.id]

                Object.values(layers_raw).forEach( fk_group => {
                    Object.values(fk_group).forEach( pivot => {
                        const layer = Object.keys(pivot).reduce( (acc,col_id) => {
                            
                            let key = col_id;
                            let value = pivot[col_id];

                            try {
                                const col = this.layers_info.columns.find( c => c.id == col_id);

                                if(col){
                                    key = col.alias;
                                    if(col.entity_type_fk && col.entity_type_fk in this.layers_info.entities_fk){
                                        const entity_fk = this.layers_info.entities_fk[col.entity_type_fk].find((d) => d.id == value);
                                        if (entity_fk) {
                                            value = entity_fk[col.col_name_fk || 'name']
                                        }
                                    }
                                }
                                
                            } catch (error) {
                                console.error('ERROR: Ocurrión un error al intentar procesar la configuración de las capas', error);
                            }
                            acc[key] = value;
                            return acc;
                        }, {});

                        layers[layer.id] = layer;

                    });
                });
            }

            return layers;

        },
        config(){
            let config = {};
            if(!_.isEmpty(this.config_data)){
                config = _.first(this.config_data.data)
            }
            return config;
        },
        col_lat(){
            let col;
            if(!_.isEmpty(this.config_data)){
                col = this.config.sh_map_column_latitude;
            }
            return col;
        },
        col_lng(){
            let col;
            if(!_.isEmpty(this.config_data)){
                col = this.config.sh_map_column_longitude;
            }
            return col;
        },
        lat_lng(){
            if(!this.col_lat || !this.col_lng){
                return [];
            }
            return [this.col_lat,this.col_lng]
        },
        data_pivots(){
            let aux = {};
            if(!_.isEmpty(this.config_data)){
                aux = this.config_data.pivots
            }
            return aux;
        },
        all_info(){
            let aux = {};
            if(!_.isEmpty(this.layers_info)){
                aux = this.layers_info;
            }
            return aux;
        },
    },
    watch:{
        lat_lng() {
            // Una vez se conoce cuáles son las columnas de latitud y longitud
            // Solicitar la data del mapa
            if(this.lat_lng.length == 2) {
              this.requestData();
            }
        },
        active_filters: {
          handler() {
            // ....
          },
          deep: true
        },
    },
    created() {
        this.init();
        this.requestConfig();
    },
    mounted(){
        this.$watch(
            "$refs.sheetsMapTools.analytical_layer",
            (new_value) => {
                this.analytical_layer = new_value;
            }
        );
        this.$watch(
            "$refs.sheetsMapTools.operational_layer",
            (new_value) => {
                this.operational_layer = new_value;
            }
        ); 
        this.$watch(
            "$refs.sheetsMapTools.base_layer",
            (new_value) => {
                this.base_layer = new_value;
            }
        );
        this.$watch("$refs.sheetsMap.bounds_filters", (active_filters) => {
            this.active_filters = active_filters;
            this.requestData();
        });
    },
    methods: {
        init() {
            let url;

            // info
            url = `${this.base_url}/entity/info/${this.entity_type_id}?ignore=['column_privileges']&page=1`;
            axios.get(url)
            .then((response) => {
                this.info = response.data.content;
            })
            .catch((error) => {
                console.error(error);
            });

        },
        // toggle .zone-d class .active
        toggleZoneD(){
            const zone_d = document.querySelector('.zone-d');
            if(zone_d){
                zone_d.classList.toggle('active');
            }
        },
        async requestData(){
            //data
            let url = `${this.base_url}/entity/data/${this.entity_type_id}?column_ids=["${this.col_lng}","${this.col_lat}"]&page=1`;

            if(!_.isEmpty(this.active_filters)){
                url += "&active_filters="+JSON.stringify(this.active_filters);
            }

            axios
            .get(url)
            .then((response) => {
                this.data = response.data.content;
            })
            .catch((error) => {
                console.error(error);
            })
        },
        async requestConfig(){

            // Realizamos dos peticiones en paralelo
            await Promise.all(
                [
                    // eslint-disable-next-line
                    new Promise(async (resolve) => {
                        // 1
                        // Consultamos la data de configuracion y pivotes
                        axios.get(this.config_url)
                        .then((response) => {
                            try {
                                
                                this.config_data = response.data.content;
                                resolve();
                                
                            } catch (error) {
                                console.error(error);
                            }
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                    }),
                    // eslint-disable-next-line
                    new Promise(async (resolve) => {
                        // 2
                        // Consultamos el INFO de la configuracion
                        let url;
                        
                        url = `${this.base_url}/entity/info/${this.config_entity_type_id}?ignore=['column_privileges']&page=1`;
                        await axios.get(url)
                        .then((response) => {
                            const content = response.data.content;
                            this.config_info = content;
                        });

                        // 3
                        if(_.isEmpty(this.config_info) || _.isEmpty(this.config_info.columns)){
                            console.error('ERROR: [this.config_info] está mal formado');
                        }
                        // Obtenemos el id de la tabla pivote
                        const entity_type_pivot_id = _.first(this.config_info.columns.filter(v => v.alias == 'sh_map_layers')).entity_type_pivot_fk;
                        
                        // 4
                        // Consultamos el INFO de la tabla pivote(layers)
                        // Si no existe en cache, hacemos la peticion
                        url = `${this.base_url}/entity/info/${entity_type_pivot_id}?ignore=['column_privileges']&page=1`;
                        await axios.get(url)
                        .then((response) => {
                            const content = response.data.content;
                            this.layers_info = content;
                            resolve();
                        });
                    }),
                ]
            );
             
        },
    },
};
</script>

<style scoped lang="scss">
  
    #app /deep/ {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        box-shadow: 2px 2px 20px #2c3e50aa;
        flex-direction: row;
        display: flex;
        height: 100vh;
        .zone-d-toggle-btn{
            cursor: pointer;
            svg{
                font-size: 1.5rem;
            }
        }
        .zone-c{
            flex-grow: 1;
            /* Eliminar este heigth si se modifica el boton "Ver esta zona" */
            height: calc(100vh - 38px);
            & > div,
            & > div > div,
            & > div > div > div{
                height: 100%;
            }
        }
        .zone-d {
            padding-top: 1rem;
            width: 48px;
            background-color: #001D09;
            display: flex;
            flex-flow: column;
            justify-content: flex-start;
            overflow: hidden;
            transition: width .4s ease;
            & > .zone-body{
                box-sizing: border-box;
                width: 300px;
                padding: 1.25rem;
                overflow: hidden;
                opacity: 0;
                transition: opacity .4s ease;
            }
            & > .zone-body > .layers-dropdown .b-dropdown{
                width: 100%;
            }
            & > .zone-body > .layers-dropdown .b-dropdown .dropdown-toggle{
                max-width: 40px;
                padding-left: 0;
                padding-right: 0;
            }
        }
        
        .zone-d.active {
            width: 308px;
        }
        .zone-d.active > .zone-body{
            opacity: 1;
        }
        .zone-d > .zone-body > .layers-dropdown .b-dropdown .dropdown-toggle::after{
            display: none;
        }
        .zone-d > button {
            color: #fff;
            background-color: #565e6466;
            border-color: transparent;
        }
    }
</style>
