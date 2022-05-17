<template>
    <div>
        <div>
            <!-- https://vue2-leaflet.netlify.app/ -->

            <!-- https://vue2-leaflet.netlify.app/components/LMap.html#demo -->
            <l-map @ready="ready()" :zoom="zoom" :center="center" ref="myMap" class="myMap">
                
                <!-- https://vue2-leaflet.netlify.app/components/LTileLayer.html -->
                <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>

                <!-- https://vue2-leaflet.netlify.app/components/LCircleMarker.html -->
                <l-circle-marker
                v-model="markers"
                    v-for="(marker, index) in markers"
                        :key="'marker-' + index"
                        :lat-lng="marker.lat_lng"
                        :radius="2"
                        v-on:click="getMarkerData(index)" 
                        >
                    <l-popup>a{{marker}} {{markers.index}} {{index}}

                        ID:
                        {{marker.id}}
                        
                    </l-popup>
                </l-circle-marker>
            </l-map>
        </div>
        <div>
            <h3>Sheets Map!!!</h3>
            <ul>
                <li>id: {{id}} </li>
                <li>entity_type_id: {{entity_type_id}} </li>
                <li>config_entity_id: {{config_entity_id}} </li>
                <li>endpoint_config: {{endpoint_config}} </li>
                <li>code: {{code}} </li>
                <li>active_filters: {{active_filters}} </li>
            </ul>
        </div>
    </div>
        
</template>

<script>

// import L from 'leaflet';
import _ from 'lodash';
import {LMap, LTileLayer, LCircleMarker,LPopup} from 'vue2-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import axios from 'axios';

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
        LCircleMarker,
        LPopup
    },
    props: {
        // Propiedades de componentes
        id              : String,
        entity_type_id  : String,
        config_entity_id: String,
        endpoint_config : String,
        code            : String,
        base_url        : String,
        // Propiedades que provienen del store
        active_filters  : Object,
        info            : Object,
        visible_col     : Array,
        data            : Object
    },
    data () {
        return {
            // map: undefined,
            url: '',
            attribution:
                '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            zoom: 10,
            center_default : [-33.472 , -70.769],
            center : undefined,
            // TO DO: Estas columnas deben llegar de una peticion que 
            // solicita la configuracion del componente
            col_lat :'5766f169-bab8-11ec-8305-04d4c47a3183',
            col_lon :'5762e5a4-bab8-11ec-8305-04d4c47a3183',
            marker_data: []
        };
    },
    computed:{
        markers(){
            
            if(
                !this.data.data
                || !this.col_lat
                || !this.col_lon
            ) return [];

            let markers = this.data.data.map( d =>{
                const lat = parseFloat(d[this.col_lat].replace(/,/, '.'));
                const lon = parseFloat(d[this.col_lon].replace(/,/, '.'));
                
                if(!lat || !lon) return;

                return {
                    lat_lng : [lat, lon],
                    id      : d.id,
                    data    : {}
                };
            })
            .filter(d => d);

            return markers;
        }
    },
    watch:{
        markers(){
            
            if(this.center_default != this.center) return;

            const total = this.markers.length;

            if(!total) return this.center_default;

            const markers_sum = this.markers.reduce ((acc,d)=>{
                acc[0] = acc[0]+d.lat_lng[0];
                acc[1] = acc[1]+d.lat_lng[1];
                return acc;
            },[0,0])
            
            this.center = [markers_sum[0]/total,markers_sum[1]/total];
        }
    },
    created(){
        this.center = this.center_default;
    },
    mounted(){
        //
    },
    methods:{
        ready(){
            this.setTileLayer();
        },
        setTileLayer(){
            this.url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        },
        validVisible(){
            let all_columns = this.info.columns;
            let valid_visible = all_columns.filter( c => {
                if (c.col_name && (c.col_name.toLowerCase() == 'valid' || c.col_name.toLowerCase() == 'visible')) {
                    return c.col_name;
                }
            });
            console.log(valid_visible);
            return valid_visible;
        },
        getMarkerData(index){

            console.log('ready', this.markers[index].id);

            let url;
            //data
            url = `${this.base_url}/entity/data/${this.config_entity_id}/${this.markers[index].id}?page=1`
            axios.get(url)
            .then((response) => {
                console.log(response.data.content);
                try {
                    let all_data = response.data.content;
                    this.markers[index].data = _.first(all_data.data) || {};
                    console.log('marker--------------------------------');
                    console.log(JSON.stringify(this.markers[index].data,false,4));

                    // UBICACION: LLAYLLAY
                    // CUADRANTE: SCOM.LLAY-LLAY 2A.SN.FELIPE
                    /*
                    {
                        "5762dc0e-bab8-11ec-8305-04d4c47a3183": 5012489414,
                        "5762de6e-bab8-11ec-8305-04d4c47a3183": "IDENTIDAD",
                        "5762ded3-bab8-11ec-8305-04d4c47a3183": "SCOM.LLAY-LLAY 2A.SN.FELIPE",
                        "5762df13-bab8-11ec-8305-04d4c47a3183": "SCOM. I.A.T. Y CARRETERAS SAN FELIPE",
                        "5762df49-bab8-11ec-8305-04d4c47a3183": "13/04/17",
                        "5762df83-bab8-11ec-8305-04d4c47a3183": "19:56",
                        "5762dfb8-bab8-11ec-8305-04d4c47a3183": "CONTROL DE VEHICULOS SIMCCAR",
                        "5762dfed-bab8-11ec-8305-04d4c47a3183": "LLAYLLAY",
                        "5762e023-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5762e059-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5762e08e-bab8-11ec-8305-04d4c47a3183": 1005803,
                        "5762e0c4-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5762e0ff-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5762e136-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5762e16a-bab8-11ec-8305-04d4c47a3183": "VIA PUBLICA",
                        "5762e19e-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5762e1d4-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5762e207-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5762e23a-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5762e26d-bab8-11ec-8305-04d4c47a3183": "CONTROL DE IDENTIDAD",
                        "5762e2a1-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5762e2d7-bab8-11ec-8305-04d4c47a3183": 3924683,
                        "5762e30e-bab8-11ec-8305-04d4c47a3183": "CONTROL PREV. SIMCCAR",
                        "5762e344-bab8-11ec-8305-04d4c47a3183": "16:00_19:59",
                        "5762e393-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5762e3cb-bab8-11ec-8305-04d4c47a3183": "PREF. ACONCAGUA",
                        "5762e400-bab8-11ec-8305-04d4c47a3183": "V ZONA VALPARAISO",
                        "5762e435-bab8-11ec-8305-04d4c47a3183": "JUEVES",
                        "5762e468-bab8-11ec-8305-04d4c47a3183": "ABRIL",
                        "5762e49b-bab8-11ec-8305-04d4c47a3183": 2017,
                        "5762e4ce-bab8-11ec-8305-04d4c47a3183": 80018,
                        "5762e506-bab8-11ec-8305-04d4c47a3183": 601010020000,
                        "5762e53c-bab8-11ec-8305-04d4c47a3183": "CONTROL PREVENTIVO",
                        "5762e56f-bab8-11ec-8305-04d4c47a3183": "CONTROL DE VEHICULOS SIMCCAR_13-04-2017 19:56_19:56:14_VIA PUBLICA_IMEI357784040668350",
                        "5762e5a4-bab8-11ec-8305-04d4c47a3183": "-70,9200566667",
                        "5766f169-bab8-11ec-8305-04d4c47a3183": "-32,8537116667",
                        "5766f25b-bab8-11ec-8305-04d4c47a3183": "CV",
                        "5766f2aa-bab8-11ec-8305-04d4c47a3183": 5,
                        "5766f2ec-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5766f32d-bab8-11ec-8305-04d4c47a3183": "NULL",
                        "5766f371-bab8-11ec-8305-04d4c47a3183": 98,
                        "5766f3b0-bab8-11ec-8305-04d4c47a3183": "14/04/17",
                        "5766f3f3-bab8-11ec-8305-04d4c47a3183": 601010021000,
                        "id": "b9c2b4c5-bab9-11ec-8305-04d4c47a3183"
                    }
                    */

                   // TO DO:
                   // Falta detectar las columnas visibles y obtener su name para mostrar al usuario una informacion legible

                    console.log('INFO--------------------------------');
                    console.log(this.info.columns);
                    this.validVisible();
                    
                } catch (error) {
                    console.error(error);
                }

            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                console.log('done data');

            });
            //MARKEER
            console.log(this.markers[index]);
            console.log(index);
            console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');




        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .myMap {
        min-height: 60vh;
    }

    li {
        text-align: left;
        margin: 0 10px;
    }
</style>
