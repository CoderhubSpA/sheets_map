<template>
    <div>
        <button type="button" class="btn btn-filter" v-on:click="filter()">
            Filtrar
        </button>
        <div>
            <!-- https://vue2-leaflet.netlify.app/ -->
            <!-- https://vue2-leaflet.netlify.app/components/LMap.html#demo -->
            <l-map 
                @ready="ready()" @moveend="getClusterInfo();" :zoom="zoom" :center="center" ref="myMap" class="myMap">
                
                <!-- https://vue2-leaflet.netlify.app/components/LTileLayer.html -->
                <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
                    <!--https://vue2-leaflet.netlify.app/components/LCircleMarker.html -->
                <l-layer-group  ref="lgroup">
                    <l-marker
                        v-for="(cluster, index) in clusters"
                        v-bind:key="index"
                        :lat-lng="cluster.lat_lng"
                    >
                        <l-icon
                            :icon-anchor="[40,40]"
                            :class-name="'marker-cluster marker-cluster-'+cluster.size"
                        >
                            <div class="headline">
                                <span> {{cluster.properties.point_count_abbreviated}}</span>
                            </div>
                        </l-icon>
                    </l-marker>
                    <l-circle-marker
                        ref="circlemarker"
                        v-for="(marker, index) in markers"
                            :key="'marker-' + index"
                            :lat-lng="marker.lat_lng"
                            :radius="2"
                            v-on:click="getMarkerData(marker)" 
                            >
                        <!-- https://leafletjs.com/reference.html#popup-->
                        <l-popup :options="{minWidth: 300}">
                            <div v-if="marker.has_data">
                                <div v-for="(col,key) in visible_columns"  :key="'col-' + key">
                                    <span> <b>{{col.name}}</b> : {{getPopupData(marker,col)}} </span>
                                </div>
                            </div>
                            <div v-else>
                                Cargando...
                            </div>
                        </l-popup>
                    </l-circle-marker>
                </l-layer-group> 
                <!-- Analytic layers -->
                <l-geo-json v-if="analytic_cluster != undefined" :geojson="analytic_cluster"></l-geo-json>
                <!-- Operative layers -->
                <!-- Escribir URL y hardcodear atributos para ver priori de capas operativas -->
                <l-wms-tile-layer
                    v-for="layer in (operative_geoserver_wms || [])"
                    :key="layer.id"
                    :base-url="layer.sh_map_has_layer_url"
                    layers="dac:DIVISION_COMUNAL"
                    name="dac:DIVISION_COMUNAL"
                    transparent="true"
                    format="image/png"
                    layer-type="base"
                    service="WMS"
                />
            </l-map>
        </div>
    </div>
        
</template>
<script src="https://unpkg.com/h3-js"></script>
<script>
// import L from 'leaflet';
import _ from 'lodash';
import {LMap, LTileLayer, LLayerGroup, LMarker, LCircleMarker, LPopup, LIcon,LGeoJson, LWMSTileLayer } from 'vue2-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import axios from 'axios';
import {h3ToGeo} from "h3-js";
import Supercluster from 'supercluster';

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
        LLayerGroup,
        LCircleMarker,
        LPopup,
        LIcon,
        LMarker,
        LGeoJson,
        "l-wms-tile-layer": LWMSTileLayer,
    },
    props: {
        // Propiedades de componentes
        id                   : String,
        entity_type_id       : String,
        config_entity_id     : String,
        config_entity_type_id: String,
        endpoint_config      : String,
        code                 : String,
        base_url             : String,
        // Propiedades que provienen del store
        active_filters       : Array,
        info                 : Object,
        data                 : Object,
        // SheetsMapTools
        config               : Object, // Todas las capas
        layers               : Object, // Todas las capas
        analytical_layer     : Array,
        operational_layer    : Array,
        base_layer           : String
        
    },
    data () {
        return {
            // map: undefined,
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution:
                '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            zoom                  : 7,
            center_default        : [-33.472 , -70.769],
            center                : undefined,
            col_lat               : undefined,
            col_lng               : undefined,
            markers_data          : {},
            map                   : undefined,
            circle                : undefined,
            /*Layers*/
            analytic_cluster        : undefined,
            analytic_countour_map   : undefined,
            base_google_map         : undefined,
            base_map_guide          : undefined,
            base_open_street_map    : undefined,
            operative_geoserver_wms : undefined,
            /*Layers*/
            clusters_markers      : [],
            bounds_filters        : [],
            bounds                : [],
            index                 : [],
            h3                    : require("h3-js")
        };
    },
    computed:{
        markers_latlgn(){
            
            if(
                !this.data.data
                || !this.col_lat
                || !this.col_lng
            ) return [];
             return [];
            // let markers = this.data.data.map( d =>{
                
            //     let lat;
            //     let lon;

            //     try {
            //         lat = parseFloat(d[this.col_lat].replace(/,/, '.'));
            //         lon = parseFloat(d[this.col_lng].replace(/,/, '.'));
            //     } catch (error) {
            //         console.log();
            //         console.error(error);
            //     }

            //     if(!lat || !lon) return;
            //     return [lat, lon];
            // })
            // .filter(d => d);      
            // return markers;
        },
        visible_columns(){
            if(!this.info.columns) return [];
            
            let all_columns = this.info.columns;
            let visible_columns = all_columns.filter( c => {
                if (c.visible == 1) {
                    return c;
                }
            })
            .filter(d => d);
            return visible_columns;
        },
        geo_json(){
            // Al recibir data, geo_json se construye a partir de esa data
            // y las columnas configuradas como lat y lng
            let geo_json = {type: "FeatureCollection", features: []};

            if(
                !this.data.data
                || !this.col_lat
                || !this.col_lng
            ) return geo_json;

            geo_json.features = this.data.data.map((d) => {
                try {
                    let lat = d[this.col_lat];
                    let lng = d[this.col_lng];

                    lat = (typeof lat == 'string') ? parseFloat(d[this.col_lat].replace(/,/, '.')):lat;
                    lng = (typeof lng == 'string') ? parseFloat(d[this.col_lng].replace(/,/, '.')):lng;
                    
                    if(!lat || !lng) return;
    
                    let coordinates = [lng,lat];
                    // let coordinates = [marker.lat_lng[1],marker.lat_lng[0]];
                    return {
                        type: "Feature",
                        properties: {
                            id: d.id,
                        },
                        geometry: {
                            type: "Point",
                            coordinates: coordinates
                        }
                    };

                } catch (error) {
                    console.error(error);
                }
            }).filter( d => d);
            
            return geo_json;      
        },
        //Supercluster
        clusters(){
            let clusters = this.clusters_markers.map( d =>{
                if(d.properties.cluster){
                
                    let count = d.properties.point_count;
                    let size =
                        count < 100 ? 'small' :
                        count < 1000 ? 'medium' : 'large';

                    return {
                        lat_lng    : [d.geometry.coordinates[1], d.geometry.coordinates[0]],
                        properties : d.properties,
                        size       : size,
                    };
                }
            })
            .filter(d => d);      
            return clusters;
        },
        markers(){
            let markers = this.clusters_markers.map( d =>{
                if(!d.properties.cluster){
                    return {
                        lat_lng  : [d.geometry.coordinates[1], d.geometry.coordinates[0]],
                        id       : d.properties.id,
                        data     : this.markers_data[d.properties.id] || {},
                        has_data : !_.isEmpty(this.markers_data[d.properties.id])
                    };
                }
            })
            .filter(d => d);      
            return markers;
        },
    },
    watch:{
        analytical_layer: {
          handler() {
            this.switchLayers(this.analytical_layer);
          },
          deep: true
        },
        operational_layer: {
          handler() {
            this.switchLayers(this.operational_layer);
          },
          deep: true
        },
        geo_json(){
            this.index.load(this.geo_json.features);
            this.getClusterInfo();
        },
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
        this.getMapConfiguration();
        // Cuando geo_json es construido, se instancia Supercluster
        this.index = new Supercluster({
            radius: 40, // clusterizar en un radio de (radio es relativo al zoom)
            maxZoom: 17 // Maximo zoom a clusterizar
        });
        this.index.load([]);
    },
    mounted(){
    },
    methods:{
        ready(){
            this.setTileLayer();
            this.map = this.$refs.myMap.mapObject;
        }, 
        filter(){
            this.findBounds();
            this.makeLayers();
        },  
        makeLayers(){

            //Una activa a la vez
            if (this.base_layer != '') {
                console.log('this.base_layer '+this.base_layer+' activo');
            }
            //de 0 a n activas
            this.switchLayers(this.analytical_layer);
            this.switchLayers(this.operational_layer);

        },  
        switchLayers(layer){

            let active_layers  = layer.filter( l => l.active);
            let disable_layers = layer.filter( l => !l.active);
            
            this.operative_geoserver_wms = [];

            active_layers.forEach(l => {
                this.activeLayers(l);
            });

            disable_layers.forEach(l => {
                this.disableLayers(l);
            });
        }, 
        activeLayers(layer){
            switch(this.layers[layer.key].sh_map_has_layer_code){
                case 'analytic_cluster' : {
                    this.getAnalyticalClusterGeoJson(this.layers[layer.key]);
                    break;

                }
                case 'analytic_countour_map' : {
                    console.log('Intento de activar '+this.layers[layer.key].sh_map_has_layer_name+' sin exito');
                    break;

                }
                case 'base_google_map' : {
                    console.log('Intento de activar '+this.layers[layer.key].sh_map_has_layer_name+' sin exito');
                    break;

                }
                case 'base_map_guide' : {
                    console.log('Intento de activar '+this.layers[layer.key].sh_map_has_layer_name+' sin exito');
                    break;

                }
                case 'base_open_street_map' : {
                    console.log('Intento de activar '+this.layers[layer.key].sh_map_has_layer_name+' sin exito');
                    break;

                }
                case 'operative_geoserver_wms' : {
                    this.operative_geoserver_wms.push(this.layers[layer.key])
                    break;

                }
                default:{
                    console.log('Intento de activar '+this.layers[layer.key].sh_map_has_layer_code+' sin exito',
                        'Intento de activar '+this.layers[layer.key].sh_map_has_layer_name+' sin exito');
                    break;
                }

            }

        }, 
        disableLayers(layer){
            switch(this.layers[layer.key].sh_map_has_layer_code){
                case 'analytic_cluster' : {
                    this.analytic_cluster = undefined;
                    break;

                }
                case 'analytic_countour_map' : {
                    this.analytic_countour_map = undefined;
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

                    this.base_open_street_mapbreak = undefined;;

                }

                default:{
                    console.log('Intento de desactivar '+this.layers[layer.key].sh_map_has_layer_code+' sin exito');
                    console.log('Intento de desactivar '+this.layers[layer.key].sh_map_has_layer_name+' sin exito');

                    break;
                }

            }

        },      
        getAnalyticalClusterGeoJson(layer){
            let bounds         = this.map.getBounds();
            let geojson_bounds = [
                [bounds._northEast.lng, bounds._northEast.lat],
                [bounds._southWest.lng, bounds._northEast.lat],
                [bounds._southWest.lng, bounds._southWest.lat],
                [bounds._northEast.lng, bounds._southWest.lat]
            ];

            let square_polygon = {
                    "type": "Polygon",
                    "coordinates": [geojson_bounds]
                  };

            let polygon;
            let square_feature;
            let h3_zoom       = this.calculateH3Zoom();
            let url           = this.base_url+layer.sh_map_has_layer_url;
            let metric        = layer.sh_map_has_layer_metric_id;
            let calculation   = layer.sh_map_has_layer_calculation;
            let filters       = this.formatFilter();
            let dimension_ids = ["h3r".concat(h3_zoom)];
            let body          = {
                calculation   : calculation,
                metric_id     : metric, // Viene de la configuracion de la capa (mapa tiene capas)
                filters       : filters, // Son los active_filters formateados
                dimension_ids : dimension_ids,
            };
            
            axios.post(url, body).then(response => {
                let all_cubes = response.data.content;
            console.log(all_cubes);
                /*
                let data      = _.first(Object.values(all_data.data)) || {};
                // ... parear h3
                // h3_indexes = data // pero parseada
                // ... parear h3
                var h3_indexes = this.polyfillNeighbors(square_polygon['coordinates'], h3_zoom);
                var filters    = this.getFilters(h3_indexes);
                polygon        = this.asPolygon(null,this.h3ToFeature(h3_indexes));
                this.analytic_cluster = polygon;
                console.log(layer);*/
            });

        },
        formatFilter(){
            if (_.isEmpty(this.active_filters)) {
                return {};
            }

            let filters = this.active_filters.map(a_f => {
                let value;

                if (typeof a_f.type !== 'undefined') {
                  value = (a_f.type == 'EQUAL') ? [a_f.search] : a_f.search;
                }else{
                    a_f.type = 'IN';
                    value    = a_f.search;
                }

                let filter = {
                    column : a_f.col_name,
                    value  : value,
                    type   : a_f.type,
                };
                return filter;
            });
            return filters;
        },
        calculateH3Zoom(){

            var zoom = this.map.getZoom();
            var h;
            switch (zoom) {
                case 1:
                case 2:
                case 3:{
                    h = 1;
                    break;
                }
                case 4:{
                    h = 2;
                    break;
                }
                case 5:
                case 6:{
                    h = 3;
                    break;
                }
                case 7:{
                    h = 4;
                    break;
                }
                case 8:
                case 9:{
                    h = 5;
                    break;
                }
                case 10:{
                    h = 6;
                    break;
                }
                case 11:
                case 12:{
                    h = 7;
                    break;
                }
                case 13:{
                    h = 8;
                    break;
                }

                case 14:{
                    h = 9;
                    break;
                }
                case 15:
                case 16:{
                    h = 10;
                    break;
                }
                case 17:{
                    h = 11;
                    break;
                }
                case 18:{
                    h = 12;
                    break;
                }

                default:{
                    h = 1;
                    break;
                }
            }
            return h;
        },
        getPopupData(marker,col){
            return (marker.data[col.id] === 'NULL') ? '-' : marker.data[col.id];
        },
        setTileLayer(){
            this.url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        },
        getMarkerData(marker){
            const url = `${this.base_url}/entity/data/${this.entity_type_id}/${marker.id}?page=1`
            axios.get(url)
            .then((response) => {
                try {
                    
                    let all_data = response.data.content;
                    let marker_data = _.first(all_data.data) || {};
                    this.$set(this.markers_data, marker.id, marker_data);
                    
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
        },
        getMapConfiguration(){
            //data
            const url = `${this.base_url}${this.endpoint_config}${this.config_entity_type_id}/${this.config_entity_id}?page=1&set_alias=alias`;
            //let url_info = `${this.base_url}${this.endpoint_config}${this.config_entity_type_id}/${this.config_entity_id}?page=1`;
            /*
            let data = this.getDataFrom(url);
                    console.log('confMap-------------------------');
                    console.log(data);
            return data;
            },
            async getDataFrom(url){*/
            let all_data;
            let data;
            axios.get(url)
            .then((response) => {
                try {
                    all_data     = response.data.content;
                    data         = _.first(all_data.data);
                    this.col_lng = data.sh_map_column_longitude;
                    this.col_lat = data.sh_map_column_latitude;
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
            //        console.log(data);
           // return data || undefined;
        },
        getClusterInfo(){
            
            console.log('getClusterInfo');
            
            let bounds   = this.map.getBounds();
            let bbox     = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];      
            let zoom     = this.map.getZoom();

            let clusters_markers = this.index.getClusters(bbox, zoom);
            
            this.clusters_markers = clusters_markers;

            //markers.clearLayers();
            //markers.addData(clusters);
            /*let circle = this.$refs.circlemarker;
            if (this.$refs.circlemarker != undefined) {
                console.log('circle--------');
                console.log(circle[0].circleOptions);
                console.log(circle[0].mapObject);
                console.log(circle);
                //this.markers.clearLayers();
                console.log('circle');
            }*/
            
        },
        findBounds(){
            var h = this.map.getZoom();
            console.log(h);
            let bounds   = this.map.getBounds();
            let all_col  = this.info.columns;

            let bounds_filters = all_col.filter((columns)=>{
                if (columns.id == this.col_lat || columns.id == this.col_lng) {
                    return columns;
                }
            }).map((columns,key)=>{
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
                if (!unique_kring.hasOwnProperty(poly)){
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
                    if (!unique_kring.hasOwnProperty(kring)){
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
                if(!filters_obj.hasOwnProperty("h3r"+r)){
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

                obj ={
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

        isInt(value) {
            return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
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
        },
        //#Convierte un indice h3 en un objeto de tipo Feature
        h3ToFeature(h3_indexes){
            let features = [];
            let index;
            for(let i in h3_indexes){
                index = h3_indexes[i];
                features.push(this.getBoundary(index));
            }
            return features;
        }
        //----------------------------------------------------------------------------------------------
        // SCRIPT DE MAURICIO
        //----------------------------------------------------------------------------------------------
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
    .marker-cluster-small {
        background-color: rgba(181, 226, 140, 0.6);
    }
    .marker-cluster-small div {
        background-color: rgba(110, 204, 57, 0.6);
    }

    .marker-cluster-medium {
        background-color: rgba(241, 211, 87, 0.6);
    }
    .marker-cluster-medium div {
        background-color: rgba(240, 194, 12, 0.6);
    }

    .marker-cluster-large {
        background-color: rgba(253, 156, 115, 0.6);
    }
    .marker-cluster-large div {
        background-color: rgba(241, 128, 23, 0.6);
    }

    .marker-cluster {
        background-clip: padding-box;
        border-radius: 20px;
    }
    .marker-cluster div {
        width: 30px;
        height: 30px;
        margin-left: 5px;
        margin-top: 5px;

        text-align: center;
        border-radius: 15px;
        font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
    }
    .marker-cluster span {
        line-height: 30px;
    }
</style>