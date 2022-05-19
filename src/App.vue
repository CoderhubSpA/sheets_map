<template>
    <div id="app">
        <SheetsMap
            :base_url              ="base_url"
            :id                    = "id"
            :entity_type_id        = "entity_type_id"
            :config_entity_type_id = "config_entity_type_id"
            :config_entity_id      = "config_entity_id"
            :endpoint_config       = "endpoint_config"
            :code                  = "code"
            :active_filters        = "null"
            :data                  = "data"
            :info                  = "info"
            :visible_col           = "visible_col"
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
            base_url              : "http://sheetsmock.local",
            id                    : "f52dd8c5-6504-4601-912f-acf56ddf7ca1",
            entity_type_id        : "35eac2b0-bab8-11ec-8305-04d4c47a3183",
            // Tipo de entidad de configuracion
            config_entity_type_id : "0482f39a-7615-47f4-9d7a-dabadcc38b38",
            // Registro de configuracion
            config_entity_id      : "bbad9606-cbdd-4afa-a6f1-873a47922d62",
            // Endpoint de configuracion
            endpoint_config       : "/entity/data/",
            code                  : "map",
            data                  : {},
            info                  : {},
            visible_col           : {}
        }
    },
    watch:{
        info(){
            let all_columns = this.info.columns;
            this.visible_col = all_columns.filter( c => {
                if (c.visible == 1) {
                    return c;
                }
            });
        }
    },
    components: {
        SheetsMap
    },
    created () {
        console.log(this.visible_col);
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
