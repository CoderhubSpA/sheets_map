<template>
  <div id="app">
    <SheetsMap
      :base_url="base_url"
      :id="id"
      :entity_type_id="entity_type_id"
      :config_entity_type_id="config_entity_type_id"
      :config_entity_id="config_entity_id"
      :endpoint_config="endpoint_config"
      :code="code"
      :active_filters="null"
      :data="data"
      :info="info"
    />
    <div class="zone zone-d">
      <div class="zone-body" style="display: grid">
        <SheetsMapTools
          :base_url="base_url"
          :id="id"
          :entity_type_id="entity_type_id"
          :config_entity_type_id="config_entity_type_id"
          :config_entity_id="config_entity_id"
          :endpoint_config="endpoint_config"
          :code="code"
          :active_filters="null"
          :data="data"
          :info="info"
          :data_pivots="data_pivots"
          :all_info="all_info"
        />
      </div>
    </div>
  </div>
</template>

<script>
import SheetsMap from "./components/SheetsMap.vue";
import SheetsMapTools from "./components/SheetsMapTools.vue";
import axios from "axios";

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
      code: "map",
      data: {},
      info: {},
      data_pivots: {},
      all_info: {}
    };
  },
  components: {
    SheetsMap,
    SheetsMapTools,
  },
  created() {
    this.init();
    this.getToolsConfiguration(this.default_info);
  },
  methods: {
    async init() {
      let url;

      // info
      url = `${this.base_url}/entity/info/${this.entity_type_id}?ignore=['columnPrivileges']`;
      axios
        .get(url)
        .then((response) => {
          let aux = response.data.content;
          let aux1 = aux.columns.map((a) => {
            return a.col_name;
          });
           console.log(aux1);
          this.info = response.data.content;
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
         //  console.log("APP done info");
        });
     //  console.log(this.info);

      //data
      url = `${this.base_url}/entity/data/${this.entity_type_id}?page=1&column_ids=["5766f169-bab8-404e-8e4c-848127197add","5762e5a4-bab8-404e-8e4c-848127197add"]`;
      await axios
        .get(url)
        .then((response) => {
          this.data = response.data.content;
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
         //  console.log("APP done data");
        });

    },
    getToolsConfiguration(default_info = '') {
      let url;
      let all_data;
      //Configuracion
      url = `${this.base_url}${this.endpoint_config}${this.config_entity_type_id}/${this.config_entity_id}?page=1&set_alias=alias`;
       axios
        .get(url)
        .then((response) => {
          try {
            all_data = response.data.content;
            this.data_pivots = all_data.pivots;
            this.getInfo(default_info);
          } catch (error) {
            console.error(error);
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
         //  console.log("sheets tools done data");
        });
    },
    getInfo(key) {
      let url = `${this.base_url}/entity/info/${key}?page=1&set_alias=alias`;
      axios
        .get(url)
        .then((response) => {
            this.all_info = response.data.content;
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
         //  console.log("sheets tools done Info");
        });
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  box-shadow: 2px 2px 20px #2c3e50aa;
}
</style>
