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
            base_url: "http://sheetsmock.local",
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
        async init(){
            let url;
            
            // info
            url = `${this.base_url}/entity/info/${this.config_entity_id}?ignore=['columnPrivileges']`
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
            url = `${this.base_url}/entity/data/${this.config_entity_id}?page=1&column_ids=["5766f169-bab8-11ec-8305-04d4c47a3183","5762e5a4-bab8-11ec-8305-04d4c47a3183"]`
            await axios.get(url)
            .then((response) => {
                console.log(response.data.content);
                
                this.data = response.data.content
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                console.log('done data');

            })

            setTimeout(() => {
                url = `${this.base_url}/entity/data/${this.config_entity_id}?page=2&column_ids=["5766f169-bab8-11ec-8305-04d4c47a3183","5762e5a4-bab8-11ec-8305-04d4c47a3183"]`

                axios.get(url)
                .then((response) => {
                    console.log(response.data.content);
                    
                    this.data = response.data.content
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    console.log('done data');

                })
            }, 1000);

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
