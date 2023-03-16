<template>
    <div>
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
        config: Object,
        map: Object,
    },
    components: {
        SuperclusterLayer
    },
    data () {
        return {
            data: {},
            info: {}
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
        console.log("SuperclusterEntityTypeLayer mounted");
        this.init();
    },
    methods:{
        async init(){
            await this.requestInfo();
            await this.requestData();
            this.getClusterMarkers();
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
    },
}
</script>
<style>

</style>
