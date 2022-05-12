<template>
    <div id="app">
        <SheetsMap
            :base_url         ="base_url"
            id               = "f52dd8c5-6504-4601-912f-acf56ddf7ca1"
            entity_type_id   = "35eac2b0-bab8-11ec-8305-04d4c47a3183"
            :config_entity_id = "config_entity_id"
            endpoint_config  = "/entity/info/"
            code             = "map"
            :active_filters  = "null"
            :data             = "data"
            :info             = "info"
        />
    </div>
</template>

<script>
import SheetsMap from './components/SheetsMap.vue'
import axios from 'axios';

export default {
    name: 'App',
    data () {
        return {
            base_url: "http://mock.sheets.local",
            config_entity_id : "35eac2b0-bab8-11ec-8305-04d4c47a3183",
            data : {},
            info : {}
        }
    },
    components: {
        SheetsMap
    },
    created () {
        console.log('created');
        this.init();

    },
    methods:{
        init(){
            let url;
            
            // info
            url = `${this.base_url}/entity/info/${this.config_entity_id}`
            axios.get(url)
            .then((response) => {
                this.info = response.data.content
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                console.log('done info');
            })

            //data
            url = `${this.base_url}/entity/data/${this.config_entity_id}?page=1`
            axios.get(url)
            .then((response) => {
                this.data = response.data.content
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                console.log('done data');

            })
        }
    }
}
</script>

<style>
#app {
font-family: Avenir, Helvetica, Arial, sans-serif;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
text-align: center;
color: #2c3e50;
margin-top: 60px;
box-shadow: 2px 2px 20px #2c3e50AA;
}
</style>
