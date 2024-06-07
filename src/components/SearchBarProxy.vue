<template>
  <search
    :is="componentName"
    :config="config"
    @change-location="$emit('change-location', $event)"
  />
</template>

<script>
import CarabinerosAddressesSearchBar from "./CarabinerosAddressesSearchBar.vue";
import SearchBarGoogleMap from './search_engines/SearchBarGoogleMap.vue';

export default {
  name: "SearchBarProxy",
  components: {
    CarabinerosAddressesSearchBar,
    SearchBarGoogleMap
  },
  props: {
    componentName: String,
    config: Object,
  },
};
</script>
