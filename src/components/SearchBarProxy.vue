<template>
  <search
    :is="component"
    :config="config"
    @change-location="$emit('change-location', $event)"
  />
</template>

<script>
export default {
  name: "SearchBarProxy",
  props: {
    componentName: String,
    config: Object,
  },
  computed: {
    component() {
      return () => import("./" + this.componentName);
    },
  },
};
</script>
