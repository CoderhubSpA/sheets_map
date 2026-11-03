<template>
  <search
    :is="componentName"
    :config="config"
    @change-location="$emit('change-location', $event)"
    @change-bounds="$emit('change-bounds', $event)"
  />
</template>

<script>
import CarabinerosAddressesSearchBar from "./CarabinerosAddressesSearchBar.vue";
import SearchBarGoogleMap from './search_engines/SearchBarGoogleMap.vue';
import SearchBarNominatim from './search_engines/SearchBarNominatim.vue';

export default {
  name: "SearchBarProxy",
  components: {
    CarabinerosAddressesSearchBar,
    SearchBarGoogleMap,
    SearchBarNominatim
  },
  props: {
    componentName: String,
    config: Object,
  },
};
</script>
