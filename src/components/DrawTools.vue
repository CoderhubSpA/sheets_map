<template>
    <div class="container">
        <div class="grid">
            <b-button class="grid-item" title="Dibujar poligono" @click.capture.stop="beginDraw('polygon')"><b-icon icon="bounding-box"></b-icon></b-button>
            <b-button class="grid-item" title="Dibujar circulo"><b-icon icon="circle"></b-icon></b-button>
            <b-button class="grid-item" title="Dibujar cuadrado"><b-icon icon="square"></b-icon></b-button>
            <b-button class="grid-item" title="Borrar dibujos"><b-icon icon="eraser"></b-icon></b-button>
        </div>
    </div>
</template>
<script>
import { BButton, BIcon } from 'bootstrap-vue'
import * as L from 'leaflet';
export default {
    components: {
        BButton,
        BIcon,
    },
    computed: {
        draft_style() {
            const style = {
                templineStyle: {
                    color: this.style_variables['polygon_draft_color'],
                    weight: this.style_variables['polygon_draft_weight']
                },
                hintlineStyle: {
                    color: this.style_variables['polygon_draft_color'],
                    dashArray: this.style_variables['polygon_draft_dash_array']
                },
                pathOptions: {
                    color: this.style_variables['polygon_draft_color'],
                    fillColor: this.style_variables['polygon_draft_fill_color'],
                    fillOpacity: this.style_variables['polygon_draft_fill_opacity']
                },
            };

            return style;
        },
    },
    props: { 
        map: Object
    },
    watch: {
        map: {
            handler(newMap) {
                console.log("mapa recibido");
                this.initializeListeners(newMap);
            },
            immediate: true
        },
    },
    methods: {
        initializeListeners(map){
            map.pm.setLang("es");
            L.PM.setOptIn(true);
        },
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
