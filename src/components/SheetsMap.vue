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
                    v-for="(marker, index) in markers"
                        :key="'marker-' + index"
                        :lat-lng="marker"
                        :radius="2"
                ></l-circle-marker>
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
import {LMap, LTileLayer, LCircleMarker} from 'vue2-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';

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
    },
    props: {
        // Propiedades de componentes
        id: String,
        entity_type_id: String,
        config_entity_id: String,
        endpoint_config: String,
        code: String,
        base_url: String,
        // Propiedades que provienen del store
        active_filters: Object,
        info: Object,
        data: Object
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
            col_lon :'5762e5a4-bab8-11ec-8305-04d4c47a3183'
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

                return [lat, lon];
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
                acc[0] = acc[0]+d[0];
                acc[1] = acc[1]+d[1];
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
