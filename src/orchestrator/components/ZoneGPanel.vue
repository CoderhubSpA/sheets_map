<template>
  <div class="zone-g-panel">
    <card-selector
      :value="cardValue"
      :options="cardOptions"
      @input="cardValue = $event"
    ></card-selector>
    <stat-list
      :items="statItems"
      @select="$emit('stat-select', $event)"
    ></stat-list>
  </div>
</template>

<script>
import CardSelector from './CardSelector.vue'
import StatList from './StatList.vue'

export default {
  name: 'ZoneGPanel',
  components: { CardSelector, StatList },
  props: {
    cardOptions: { type: Array, default: () => [] },
    statItems:   { type: Array, default: () => [] },
  },
  data() {
    return {
      cardValue: this.cardOptions.length ? this.cardOptions[0].value : null,
    }
  },
}
</script>

<style lang="scss" scoped>
.zone-g-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
</style>
