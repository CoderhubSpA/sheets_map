<template>
  <div class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-bar__tab"
      :class="{ 'tab-bar__tab--active': activeTab === tab.value }"
      @click="selectTab(tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'TabBar',
  props: {
    tabs:  { type: Array,  default: () => [] },
    value: { type: String, default: null },
  },
  data() {
    return {
      activeTab: this.value || (this.tabs.length ? this.tabs[0].value : null),
    }
  },
  watch: {
    value(val) {
      this.activeTab = val;
    },
  },
  methods: {
    selectTab(tabValue) {
      this.activeTab = tabValue;
      this.$emit('input', tabValue);
      this.$emit('change', tabValue);
    },
  },
};
</script>

<style lang="scss" scoped>
$active-blue: #3D52D5;

.tab-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
    padding: 12px 12px 16px 12px;

  &__tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 16px;
    border-radius: 999px;
    border: 1.5px solid var(--gray-scale-3);
    background-color: #ffffff;
    color: var(--gray-scale-7);
    font-size: var(--font-sm-size);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family);
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    outline: none;

    &:hover {
      background-color: var(--gray-scale-2);
    }

    &--active {
      background-color: $active-blue;
      border-color: $active-blue;
      color: #ffffff;

      &:hover {
        background-color: darken($active-blue, 8%);
      }
    }
  }
}
</style>
