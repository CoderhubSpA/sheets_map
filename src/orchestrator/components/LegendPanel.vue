<template>
  <div class="legend-panel">
    <div class="legend-panel__header">
      <span class="legend-panel__title">{{ title }}</span>
    </div>
    <div class="legend-panel__body">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="legend-panel__row"
      >
        <span
          class="legend-panel__dot"
          :style="{ backgroundColor: item.color }"
        ></span>
        <span class="legend-panel__pill primary">{{ item.range }}</span>
        <span class="legend-panel__pill secondary">{{ item.area }}</span>
        <span class="legend-panel__pill tertiary">{{ item.count }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LegendPanel',
  props: {
    title: { type: String, default: '' },
    items: { type: Array, default: () => [] },
    // Each item: { color: String, range: String, area: String, count: Number|String }
  },
};
</script>

<style lang="scss" scoped>
.legend-panel {
  display: inline-flex;
  flex-direction: column;
  border-radius: 12px;
  padding: 8px 12px;
  gap: 4px;
  pointer-events: auto;

  &__header {
    display: flex;
    align-items: center;
    padding-bottom: 4px;
  }

  &__title {
    font-size: var(--font-sm-size);
    font-weight: var(--font-weight-bold);
    color: var(--text-color);
    background-color: var(--gray-scale-1);
    white-space: nowrap;
    padding: 4px 8px;
    border-radius: 999px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }

  &__dot {
    display: inline-block;
    width: 22px;
    height: 22px;
    min-width: 22px;
    border-radius: 50%;
    flex-shrink: 0;
    border: solid 4px #fff;
  }

  &__pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 10px;
    border-radius: 999px;
    border: 1px solid var(--gray-scale-3);
    background-color: var(--gray-scale-1);
    color: var(--text-color);
    font-size: var(--font-sm-size);
    white-space: nowrap;
    min-width: 52px;
    &.primary {
      min-width: 200px;
    }
    &.secondary {
      min-width: 100px;
    }
    &.tertiary {
      min-width: 80px;
    }
  }
}
</style>
