<template>
  <div id="app">
    
    <SheetsMap
      id = "f52dd8c5-6504-4601-912f-acf56ddf7ca1"
      entity_type_id = "35eac2b0-bab8-11ec-8305-04d4c47a3183"
      config_entity_id = "35eac2b0-bab8-11ec-8305-04d4c47a3183"
      endpoint_config = "/api/sheets/form/"
      code = "map"
      active_filters = "null"
    />

  </div>
</template>

<script>
import SheetsMap from './components/SheetsMap.vue'

export default {
  name: 'App',
  components: {
    SheetsMap
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
}
</style>
