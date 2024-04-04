<template>
    <div class="container">
        <h3> Estilo de dibujo </h3>
        <div class="tools-container">
            <h3> Dibujar </h3>
            <div class="buttons-container">
                <b-button class="grid-item" title="Dibujar poligono" @click.capture.stop="beginDraw('polygon')"><b-icon
                        icon="bounding-box" scale="2"></b-icon></b-button>
                <b-button class="grid-item" title="Dibujar circulo" @click.capture.stop="beginDraw('circle')"><b-icon
                        icon="circle" scale="2"></b-icon></b-button>
                <b-button class="grid-item" title="Dibujar cuadrado"
                    @click.capture.stop="beginDraw('rectangle')"><b-icon icon="square" scale="2"></b-icon></b-button>
                <b-button class="grid-item" title="Dibujar punto" @click.capture.stop="beginDraw('circle-marker')"
                    :pressed="drawing_marker"><b-icon icon="record-circle" scale="3"></b-icon></b-button>
                <b-button class="grid-item" title="Crear etiqueta" @click.capture.stop="beginDraw('text')"><b-icon
                        icon="fonts" scale="2"></b-icon></b-button>
                <!-- <b-button class="grid-item" title="Crear Simbolo" @click.capture.stop="beginDraw('symbol')"><b-icon
                        icon="flag"></b-icon></b-button> -->
                <b-button class="grid-item" title="Borrar dibujos" @click.capture.stop="toggleDelete()"><b-icon
                        icon="eraser" scale="2"></b-icon></b-button>
                <b-button class="grid-item" title="Borrar todo" @click.capture.stop="DeleteAll()"
                    :pressed="false"><b-icon icon="trash" scale="2"></b-icon></b-button>
                <b-button id="btn-icons" class="grid-item" title="Iconos">
                    <b-icon v-if="this.selectedImage===null" icon="geo-alt" scale="2"></b-icon>
                    <b-img v-else :src="this.selectedImage" fluid></b-img>
                </b-button>
                <b-popover target="btn-icons" triggers="click" :show.sync="popoverShow">
                    <div class="thumbnail-selector">
                        <section v-for="(icons, tag) in tags_with_icons" :key="tag">
                            <h4>{{ tag }}</h4>
                            <div class="thumbnail" v-for="(icon, index) in icons" :key="index"
                                @click="selectImage(icon)">
                                <img :src="icon.icon_src" :alt="'Icon ' + icon.id" />
                            </div>
                        </section>
                    </div>
                </b-popover>
            </div>
            <div class="thumbnail-selector">
                <section v-for="(icons, tag) in tags_with_icons" :key="tag">
                    <h3>{{ tag }}</h3>
                    <div class="thumbnail" v-for="(icon, index) in icons" :key="index" @click="selectImage(icon)">
                        <img :src="icon.icon_src" :alt="'Icon ' + icon.id" />
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>
<script>
import { BButton, BIcon, BPopover, BImg } from "bootstrap-vue";
import * as L from "leaflet";
import axios from "axios";
export default {
    components: {
        BButton,
        BIcon,
        BPopover,
        BImg,
    },
    computed: {},
    props: {
        map: Object,
        config_entity_type_id: String,
        endpoint_config: String,
        
    },
    data() {
        return {
            tags_with_icons: {},
            selectedImage: null,
            temporary_marker: null,
            drawing_marker: false,
            popoverShow: false,
        };
    },
    methods: {
        beginDraw(shape) {
            this.$emit("set_draw_is_filter", false);
            this.map.pm.disableGlobalRemovalMode();
            switch (shape) {
                case "polygon": {
                    this.map.pm.enableDraw("Polygon");

                    break;
                }
                case "circle": {
                    this.map.pm.enableDraw("Circle");

                    break;
                }
                case "rectangle": {
                    this.map.pm.enableDraw("Rectangle");

                    break;
                }
            }
        },
        toggleDelete() {
            this.map.pm.toggleGlobalRemovalMode();
        },
        DeleteAll() {
            this.map.eachLayer((layer) => {
                if (layer.pm) {
                    layer.remove();
                }
            });
        },
        DownloadLayers() {
            let geoJson = {
                type: "FeatureCollection",
                features: [],
            };
            this.map.eachLayer((layer) => {
                if (layer.toGeoJSON) {
                    geoJson.features.push(layer.toGeoJSON());
                    if (layer.pm) {
                        console.log(layer);
                    }
                }
            });
            console.log(geoJson);
        },
        loadIcons() {
            const url = `${this.endpoint_config}${this.config_entity_type_id}?page=1&set_alias=name`;
            axios
                .get(url)
                .then((response) => {
                    let data = response.data.content.data;
                    let document = response.data.content.entities_fk.document;
                    data.map((item) => {
                        const tag = item.tag;
                        if (this.tags_with_icons[tag] == undefined) {
                            this.$set(this.tags_with_icons, tag, []);
                        }
                        this.tags_with_icons[tag].push({
                            id: item.id,
                            name: item.nombre,
                            tag: item.tag,
                            icon_src: document.find((doc) => doc.id == item.icono).src,
                        });
                    });
                    console.log(this.tags_with_icons)
                })
                .catch((error) => {
                    console.log(error);
                });
        },
        selectImage(icon) {
            this.selectedImage = icon.icon_src;
            if (this.temporary_marker) {
                this.map.removeLayer(this.temporary_marker);
            }
            this.map.on("mousemove", this.updateMarkerPosition);
            this.map.once("click", this.placeMarker);
            this.popoverShow = false;
        },
        updateMarkerPosition(e) {
            const { lat, lng } = e.latlng;
            if (!this.temporary_marker) {
                this.temporary_marker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: this.selectedImage,
                        iconSize: [40, 40],
                        iconAnchor: [20, 40],
                    }),
                }).addTo(this.map);
            } else {
                this.temporary_marker.setLatLng([lat, lng]);
            }
        },
        placeMarker(e) {
            const { lat, lng } = e.latlng;

            L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: this.selectedImage,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                }),
                pmIgnore: false,
            }).addTo(this.map);
            if (this.temporary_marker) {
                this.map.removeLayer(this.temporary_marker);
                this.temporary_marker = null;
            }
            this.map.off("mousemove", this.updateMarkerPosition);
            this.map.off("click", this.placeMarker);
        },
    },
    created() {
        this.loadIcons();
    },
    mounted() {
        console.log("draw tools mounted");
        console.log(this.config_entity_type_id);
        console.log(this.endpoint_config);
    },
};
</script>

<style>
.tools-container {
    background-color: darkgray;
    border-radius: 2%;
    padding: 2rem;
}

.buttons-container {
    padding: 2rem;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
}

.grid-item {
    aspect-ratio: 1 / 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: white;
    border-radius: 5px;
    padding: 0.5rem;
    background-color: #0F2D20;
    min-width: 9rem;

}

.thumbnail-selector {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    /* Adjust for thumbnail sizing */
    gap: 10px;
    /* Adjust based on thumbnail size and count */
}

.thumbnail img {
    width: 40px;
    /* Adjust thumbnail image size as needed */
    height: auto;
}
</style>
