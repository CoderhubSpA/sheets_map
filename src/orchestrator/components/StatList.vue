<template>
  <div class="stat-list">
    <div
      v-for="item in items"
      :key="item.id"
      class="stat-list__pill"
      @click="$emit('select', item)"
    >
      <span class="stat-list__icon-badge" v-if="item.icon">
        <b-icon :icon="item.icon" font-scale="0.9"></b-icon>
      </span>
      <span class="stat-list__text">
        <span class="stat-list__value">{{ item.value }}</span>
        {{ item.label }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatList',
  props: {
    items: {
      type: Array,
      default: () => []
      // Each item: { icon: String, value: String, label: String, id: String }
    }
  },
  emits: ['select'],
};
</script>

<style lang="scss" scoped>
$accent-color: #E8735A;

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;

  &__pill {
    // Copied from legend-panel__pill and extended for clickable rows
    display: inline-flex;
    align-items: center;
    padding: 4px 12px 4px 4px;
    border-radius: 999px;
    border: 1px solid var(--gray-scale-3);
    background-color: #ffffff;
    color: var(--text-color);
    font-size: var(--font-sm-size);
    white-space: nowrap;
    // Additional for clickable:
    cursor: pointer;
    gap: 8px;
    transition: background-color 0.15s ease;

    &:hover {
      background-color: var(--gray-scale-2);
    }
  }

  &__icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    min-width: 26px;
    border-radius: 50%;
    border: 2px solid $accent-color;
    color: $accent-color;
    background-color: #ffffff;
    font-size: 0.75rem;
  }

  &__text {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-sm-size);
    color: var(--text-color);
  }

  &__value {
    font-weight: var(--font-weight-bold);
  }
}
</style>
