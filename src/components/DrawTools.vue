<template>
    <div class="container">
        <div class="grid">
            <b-button class="grid-item" title="Dibujar poligono" @click.capture.stop="beginDraw('polygon')"><b-icon icon="bounding-box"></b-icon></b-button>
            <b-button class="grid-item" title="Dibujar circulo" @click.capture.stop="beginDraw('circle')"><b-icon icon="circle"></b-icon></b-button>
            <b-button class="grid-item" title="Dibujar cuadrado" @click.capture.stop="beginDraw('rectangle')"><b-icon icon="square"></b-icon></b-button>
            <b-button class="grid-item" title="Borrar dibujos" @click.capture.stop="toggleDelete()"><b-icon icon="eraser"></b-icon></b-button>
        </div>
    </div>
</template>
<script>
import { BButton, BIcon } from 'bootstrap-vue'
export default {
    components: {
        BButton,
        BIcon,
    },
    computed: {
    },
    props: { 
        map: Object
    },
    methods: {
        beginDraw(shape) {
            this.$emit('set_draw_is_filter', false);
            this.map.pm.disableGlobalRemovalMode();
            switch (shape) {
                case 'polygon': {
                    this.map.pm.enableDraw('Polygon');

                    break;
                }
                case 'circle': {
                    this.map.pm.enableDraw('Circle');

                    break;
                }
                case 'rectangle': {
                    this.map.pm.enableDraw('Rectangle');

                    break;
                }
            }
        },
        toggleDelete(){
            this.map.pm.toggleGlobalRemovalMode();
        }
    }
}
</script>

<style>
.container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    /* Updated this line to align items to the top */
    height: 100vh;
    margin: 1rem;
}

.grid {
    display: grid;
    grid-template-rows: repeat(4, 1fr);
    grid-gap: 1rem;
}

.grid-item {
    background-color: #ccc;
    border: 1px solid black;
    /* Add this line to color the borders */
    display: flex;
    justify-content: center;
    align-items: center;
    --size: 36px;
    width: var(--size);
    height: var(--size);
    padding: 0;
    border: none;
    font-size: 0.7rem;
}
</style>
