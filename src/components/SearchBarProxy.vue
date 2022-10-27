<template>
  <search
    :is="componentName"
    :config="config"
    @change-location="$emit('change-location', $event)"
  />
</template>

<script>
import CarabinerosAddressesSearchBar from "./CarabinerosAddressesSearchBar.vue";

export default {
  name: "SearchBarProxy",
  components: {
    CarabinerosAddressesSearchBar,
  },
  props: {
    componentName: String,
    config: Object,
  },
};
</script>
