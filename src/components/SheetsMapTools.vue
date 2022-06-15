<template>
  <div>
    <div>
      <div>
        <b-dropdown 
          id="dropdown_base_layers" 
          variant="btn-outline-second"
          dropleft
        >
          <template #button-content>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-layers-half"
              viewBox="0 0 16 16"
            >
              <path
                d="M8.235 1.559a.5.5 0 0 0-.47 0l-7.5 4a.5.5 0 0 0 0 .882L3.188 8 .264 9.559a.5.5 0 0 0 0 .882l7.5 4a.5.5 0 0 0 .47 0l7.5-4a.5.5 0 0 0 0-.882L12.813 8l2.922-1.559a.5.5 0 0 0 0-.882l-7.5-4zM8 9.433 1.562 6 8 2.567 14.438 6 8 9.433z"
              />
            </svg>
          </template>
          <b-dropdown-item 
            @click="getOption(option)" 
            v-for="option in base_layers"
            :key="option.key"
            :value="option.value"
            :class="{ 
              'layer-active': option.active
            }"
          >
            {{ option.value }}
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </div>
    <div>
      <div>
        <b-dropdown 
          id="dropdown_analytical_layer"
          dropleft
          variant="btn-outline-second"
        >
          <template #button-content>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-bezier"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M0 10.5A1.5 1.5 0 0 1 1.5 9h1A1.5 1.5 0 0 1 4 10.5v1A1.5 1.5 0 0 1 2.5 13h-1A1.5 1.5 0 0 1 0 11.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm10.5.5A1.5 1.5 0 0 1 13.5 9h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zM6 4.5A1.5 1.5 0 0 1 7.5 3h1A1.5 1.5 0 0 1 10 4.5v1A1.5 1.5 0 0 1 8.5 7h-1A1.5 1.5 0 0 1 6 5.5v-1zM7.5 4a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z"
              />
              <path
                d="M6 4.5H1.866a1 1 0 1 0 0 1h2.668A6.517 6.517 0 0 0 1.814 9H2.5c.123 0 .244.015.358.043a5.517 5.517 0 0 1 3.185-3.185A1.503 1.503 0 0 1 6 5.5v-1zm3.957 1.358A1.5 1.5 0 0 0 10 5.5v-1h4.134a1 1 0 1 1 0 1h-2.668a6.517 6.517 0 0 1 2.72 3.5H13.5c-.123 0-.243.015-.358.043a5.517 5.517 0 0 0-3.185-3.185z"
              />
            </svg>
          </template>
          <b-dropdown-item 
            @click="getOption(option)"
            v-for="option in analytical_layer"
            :key="option.key"
            :value="option.value"
            href="#"
            :class="{ 
              'layer-active': option.active
            }"
          >
            {{ option.value }}
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </div>
    <div>
      <div>
        <b-dropdown
          id="dropdown_operational_layer"
          dropleft
          variant="btn-outline-second"
        >
          <template #button-content>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-stack"
              viewBox="0 0 16 16"
            >
              <path
                d="m14.12 10.163 1.715.858c.22.11.22.424 0 .534L8.267 15.34a.598.598 0 0 1-.534 0L.165 11.555a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.66zM7.733.063a.598.598 0 0 1 .534 0l7.568 3.784a.3.3 0 0 1 0 .535L8.267 8.165a.598.598 0 0 1-.534 0L.165 4.382a.299.299 0 0 1 0-.535L7.733.063z"
              />
              <path
                d="m14.12 6.576 1.715.858c.22.11.22.424 0 .534l-7.568 3.784a.598.598 0 0 1-.534 0L.165 7.968a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.659z"
              />
            </svg>
          </template>
          <b-dropdown-item 
            @click="getOption(option)"
            v-for="option in operational_layer"
            :key="option.key"
            :value="option.value"
            href="#"
            :class="{ 
              'layer-active': option.active
            }"
          >
            {{ option.value }}
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </div>
  </div>
</template>
<script>

import _ from 'lodash';
import Vue from "vue";
import BootstrapVue from 'bootstrap-vue/dist/bootstrap-vue.esm';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'bootstrap/dist/css/bootstrap.css';

Vue.use(BootstrapVue);

export default {

  props: {
    // Propiedades de componentes
    id: String,
    entity_type_id: String,
    config_entity_id: String,
    config_entity_type_id: String,
    endpoint_config: String,
    code: String,
    base_url: String,
    active_filters: Array,
    info: Object,
    data: Object,
    data_pivots: {
      type: Object , 
      default:() => {},
    },
    all_info: {
      type: Object, 
      default:() => {},
    },
  },
  data() {
    return {
      data_tools: [],
      data_tools_id: "",
      base_layer : '',
      base_layers: [],
      operational_layer: [],
      analytical_layer: [],
    };
  },
  computed: {
    api_info(){        
      let api_info = [];
      if(!_.isEmpty(this.data_pivots) && !_.isEmpty(this.all_info)){
        api_info = this.parseData(this.data_pivots, this.all_info);
      }
      return api_info;
    },
  },
  watch: {
    api_info:{
      handler(){
        if(Array.isArray(this.api_info)){
          this.base_layers       = this.api_info.filter((item) => item.type == "base");
          this.operational_layer = this.api_info.filter((item) => item.type == "operative");
          this.analytical_layer  = this.api_info.filter((item) => item.type == "analytic");
        }
      },
      deep:true
    }
  },
  methods: {
    collapseLeft() {
      console.log("collapseLeft");
      //       this.$refs['zone-a'].classList.toggle('collapsed')
    },
    collapseRight() {
      console.log("collapseRight");
      //   this.$refs['zone-c'].classList.toggle('collapsed')
    },
    getOption(option) {
      let  option_active_val = option.active;
      switch (option.type) {
        case 'base' :
         // La capa base solo debe tener una activa
          if (this.base_layer ==  option.key  ){
              option.active = !option_active_val;
              this.base_layer = '';
          } else {
             if (this.base_layer == ''){
              option.active = !option_active_val
              this.base_layer = option.key;
            } else 
              if (this.base_layer !==  option.key){
              let cb  = this.base_layers.find(
                (elem) => elem.key == this.base_layer
              );
               cb.active = option_active_val;
               option.active = !option_active_val;
               this.base_layer = option.key
            } 
          }
        break;  
        case 'analytic' :
          option.active = !option_active_val 
        break;  
        case 'operative' :
          option.active = !option_active_val  
        break;  
      }  
      /* 
      base
      analytic
      operative */
    },
    parseData(data_pivots, all_info) {
      let info_columns;
      let info_tools;
      let pivots_values;
      let pivots_values_valid;
      let pivots_details;
      let api_info_result = [];
      let pivots = Object.values(data_pivots);
      let pivots_valid = 0;
     
      pivots.forEach((column_group) => {
        Object.values(column_group).forEach((fk_group) => {
          Object.values(fk_group).forEach((pivot) => {
            Object.keys(pivot).map((key, index) => {
              info_columns = all_info.columns.find(
                (elem) => elem.id == key
              );
              if (
                info_columns &&
                all_info.entities_fk[info_columns.entity_type_fk] &&
                info_columns.entity_type_fk &&
                info_columns.alias == "sh_map_has_layer_type" 
               ) {
                let col_name_fk = info_columns.col_name_fk || "name";
                pivots_values = Object.values(pivot);
                pivots_details = all_info.entities_fk[
                  info_columns.entity_type_fk
                ].find((elem) => elem.id == pivots_values[index]);
                if (pivots_details) {
                  info_tools = {
                    key: pivot.id,
                    type: pivots_details[col_name_fk],
                    value: pivot.name,
                    active: false, // la capa esta desactiva por default
                  };
                }
              }
              if (
                info_columns &&
                info_columns.alias == "sh_map_has_layer_valid"  &&
                key == info_columns.id
              ) {
                pivots_values_valid = Object.values(pivot);
                pivots_valid = pivots_values_valid[index];
                if (info_tools && pivots_valid) {
                  api_info_result.push(info_tools);
                }
                info_tools = null;
              }
            });
          });
        });
      });
      return api_info_result;
    },
  },
};
</script>

<style scoped>
.btn-outline-second {
  color: #000000 !important;
  border-color: #6c757d;
}
.layer-active {
  border: 3px #000000;
  background-color: gray;
}
</style>

 