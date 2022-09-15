<template>
  <search
    :is="componentName"
    :config="config"
    @change-location="$emit('change-location', $event)"
  />
</template>

<script>
import SAITSearchBar from "./SAITSearchBar.vue";

export default {
  name: "SearchBarProxy",
  components: {
    SAITSearchBar,
  },
  props: {
    componentName: String,
    config: Object,
  },
};
</script>
