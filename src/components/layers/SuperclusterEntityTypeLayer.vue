<template>
    <div class="own_super_cluster">
        <!--https://vue2-leaflet.netlify.app/components/LCircleMarker.html -->
        <supercluster-layer
                :visible="true"
                :data="data"
                :info="info"
                :map="map"
                :config="config"
                :col_lat="col_lat"
                :col_lng="col_lng"
                :entity_type_id="entity_type_id"
                :base_url="base_url"
                :theme="layer.sh_map_has_layer_custom_styles"
                ref="supercluster_layer"
            ></supercluster-layer>
    </div>
</template>
<script>
import axios from "axios";
import _ from "lodash";
import SuperclusterLayer from './SuperclusterLayer.vue';

export default {
    name: "SuperclusterEntityTypeLayer",
    props: {
        layer:{
            type: Object,
            required: true
        },
        base_url:{
            type: String
        },
        cluster_key : String,
        css_vars : Object,
        config   : Object,
        map      : Object,
    },
    components: {
        SuperclusterLayer
    },
    data () {
        return {
            data: {},
            info: {},
            refreshDataId: null
        };
    }, 
    computed: {
        entity_type_id(){
            return this.layer.sh_map_has_layer_entity_type_id;
        },
        col_lng(){
            return this.info?.columns?.find(col => col.format == 'LONGITUDE')?.id;
        },
        col_lat(){
            return this.info?.columns?.find(col => col.format == 'LATITUDE')?.id;
        },
    },
    mounted() {
        this.init();
    },
    destroyed() {
        clearInterval(this.refreshDataId);
    },
    methods:{
        async init(){
            await this.requestInfo();
            await this.requestData();
            this.getClusterMarkers();

            if (this.layer.sh_map_has_layer_interval_delay_seconds && this.layer.sh_map_has_layer_interval_delay_seconds > 0) {
                this.startRefreshData(this.layer.sh_map_has_layer_interval_delay_seconds);
            }
        },
        async requestInfo(){

            const url = `${this.base_url}/entity/info/${this.entity_type_id}?ignore=['column_privileges']`;
            
            return axios.get(url).then((response) => {
                const content = response.data.content;
                
                this.info = content;

                if(_.isEmpty(this.info) || _.isEmpty(this.info.columns)){
                    console.error('ERROR: [this.config_info] está mal formado');
                }
            });

        },
        async requestData(){
            //data
            const url = `${this.base_url}/entity/data/${this.entity_type_id}?column_ids=["${this.col_lng}","${this.col_lat}"]&page=1`;

            return axios.get(url).then((response) => {
                const content = response.data.content;

                this.data = content;
            })
            .catch((error) => {
                console.error(error);
            })
        },
        getClusterMarkers(){
            return this.$refs.supercluster_layer.getClusterMarkers();
        },
        startRefreshData(seg) {
            const setSeconds = seg * 1000;

            this.refreshDataId = setInterval(this.requestData, setSeconds);
        },
        // stopRefreshData() {
        //     clearInterval(this.refreshDataId);
        //     this.refreshDataId = null;
        // },
        // refreshData(oldData, newData) {
        //     //Se buscan nuevo puntos para agregarlos a la data existente
        //     newData.forEach(function(newD) {
        //         let findId = oldData.find(function(oldD) {
        //             return oldD.id === newD.id;
        //         });

        //         if(!findId) {
        //             oldData.push(newD);
        //         }
        //     });

        //     return oldData.map(function(oldD) {
        //         //Se busca si los puntos existentes siguen presente en la nueva data
        //         let findId = newData.find(function(newD) {
        //             return newD.id === oldD.id;
        //         });

        //         if(!findId) {
        //             return;
        //         }
        //         // Se actualizan las coordenas de los puntos existentes desde la nueva data
        //         newData.forEach(function(newD) {
        //             if(oldD.id === newD.id) {
        //                 if(oldD.lat !== newD.lat && oldD.lng !== newD.lng || oldD.lat === newD.lat && oldD.lng !== newD.lng || oldD.lat !== newD.lat && oldD.lng === newD.lng) {
        //                     oldD.lat = newD.lat;
        //                     oldD.lng = newD.lng;
        //                 }
        //             }
        //         });

        //         return oldD;
        //     }).filter(function(f) {
        //         return f !== undefined;
        //     });
        // },
    },
}
</script>
<style >

    .marker-cluster-small-external-source {
        background-color: var(--sh-map-point-cluster-small-external-source-color);
    }
    .marker-cluster-small-external-source div {
        background-color: var(--sh-map-point-cluster-small-external-source-color-div);
        width:            var(--sh-map-point-cluster-small-external-source-size);
        height:           var(--sh-map-point-cluster-small-external-source-size);
        font:             var(--sh-map-point-cluster-small-external-source-font);
        color:            var(--sh-map-point-cluster-small-external-source-font-color);
        border-style:     var(--sh-map-point-cluster-small-external-source-border-style);
        border-width:     var(--sh-map-point-cluster-small-external-source-border-width);
        border-color:     var(--sh-map-point-cluster-small-external-source-border-color);
    }

    .marker-cluster-medium-external-source {
        background-color: var(--sh-map-point-cluster-medium-color);
    }
    .marker-cluster-medium-external-source div {
        background-color: var(--sh-map-point-cluster-medium-external-source-color-div);
        width:            var(--sh-map-point-cluster-medium-external-source-size);
        height:           var(--sh-map-point-cluster-medium-external-source-size);
        font:             var(--sh-map-point-cluster-medium-external-source-font);
        color:            var(--sh-map-point-cluster-medium-external-source-font-color);
        border-style:     var(--sh-map-point-cluster-medium-external-source-border-style);
        border-width:     var(--sh-map-point-cluster-medium-external-source-border-width);
        border-color:     var(--sh-map-point-cluster-medium-external-source-border-color);
    }

    .marker-cluster-large-external-source {
        background-color: var(--sh-map-point-cluster-large-external-source-color);
    }
    .marker-cluster-large-external-source div {
        background-color: var(--sh-map-point-cluster-large-external-source-color-div);
        width:            var(--sh-map-point-cluster-large-external-source-size);
        height:           var(--sh-map-point-cluster-large-external-source-size);
        font:             var(--sh-map-point-cluster-large-external-source-font);
        color:            var(--sh-map-point-cluster-large-external-source-font-color);
        border-style:     var(--sh-map-point-cluster-large-external-source-border-style);
        border-width:     var(--sh-map-point-cluster-large-external-source-border-width);
        border-color:     var(--sh-map-point-cluster-large-external-source-border-color);
    }


</style>
