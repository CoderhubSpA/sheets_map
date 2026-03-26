<template>
  <div class="map-toolbar">
    <button
      v-for="btn in buttons"
      :key="btn.action"
      class="map-toolbar__btn"
      :class="{ 'map-toolbar__btn--active': activeAction === btn.action }"
      :title="btn.tooltip"
      @click="onButtonClick(btn.action)"
    >
      <img v-if="btn.img" :src="getImgSrc(btn.img)" class="map-toolbar__icon-img" alt="" />
      <b-icon v-else :icon="btn.icon" font-scale="1.2"></b-icon>
    </button>
  </div>
</template>

<script>
export default {
  name: 'MapToolbar',
  props: {
    activeAction: { type: String, default: null }
  },
  data() {
    return {
      buttons: [
        { icon: 'plus-lg',              action: 'zoom-in',           tooltip: 'Acercar' },
        { icon: 'dash-lg',              action: 'zoom-out',          tooltip: 'Alejar' },
        { icon: 'bounding-box-circles', action: 'viewfinder',        tooltip: 'Encuadrar' },
        { icon: null, img: 'pointer',   action: 'locate',            tooltip: 'Mi ubicación' },
        { icon: 'bar-chart-line-fill',  action: 'analytics',         tooltip: 'Analíticas' },
        { icon: 'grid',                 action: 'layers',            tooltip: 'Capas' },
        { icon: 'eye-slash',            action: 'toggle-visibility', tooltip: 'Ocultar capas' },
        { icon: 'pencil-fill',          action: 'edit',              tooltip: 'Editar' },
      ]
    }
  },
  methods: {
    onButtonClick(action) {
      this.$emit('action', action)
    },
    getImgSrc(name) {
      const images = {
        pointer: new URL('../../assets/pointer_icon.png', import.meta.url).href,
      }
      return images[name] || ''
    }
  }
}
</script>

<style lang="scss" scoped>
$toolbar-blue: #3D52D5;

.map-toolbar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  padding: 8px;
  width: 100%;

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 12px;
    background-color: #ffffff;
    color: $toolbar-blue;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: background-color 0.15s ease, color 0.15s ease;
    outline: none;

    &:hover {
      background-color: var(--gray-scale-2);
    }

    &--active {
      background-color: $toolbar-blue;
      color: #ffffff;
    }
  }

  &__icon-img {
    width: 2em;
    height: 2em;
    object-fit: contain;
  }

  &__btn--active &__icon-img {
    filter: brightness(0) invert(1);
  }
}
</style>
