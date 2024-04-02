<template>
    <div v-if="createPermission" >
        <b-button class="get-point-btn" @click.capture.stop="getPoint()" title="Abrir un formulario haciendo click en el mapa">
            <b-icon icon="file-text"></b-icon>
        </b-button>

        <div v-if="pointStructure">
            <l-geo-json :geojson="point" :options-style="draft_style"></l-geo-json>
        </div>

        <div v-if="operativeGeojsonList.length > 0 && searchingPoint">
            <div v-for="operativeGeojson in operativeGeojsonList" :key="operativeGeojson.id">
                <l-geo-json :geojson="operativeGeojson.geojson" :options-style="activeLayerDraftStyle"></l-geo-json>
            </div>
        </div>
    </div>
</template>

<script>
import { LGeoJson } from 'vue2-leaflet';
import { BButton, BIcon } from 'bootstrap-vue';


export default {
    name: 'OpenFormPoint',
    components: {
        LGeoJson,
        BButton,
        BIcon
    },
    props: {
        info: {
            type: Object,
            required: true,
        },
        mapPoint: {
            type: Object,
            required: false,
        },
        styleVariables: {
            type: Object,
            required: false,
        },
        operativeGeojsonList: {
            type: Array,
            required: false,
        },
    },
    data() {
        return {
            createPermission: false,
            pointStructure: {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "Point",
                            "coordinates": [
                                []
                            ]
                        }
                    }
                ]
            },
            point: null,
            searchingPoint: false,
        };
    },
    computed: {
        draft_style() {
            const style = {
                color: this.styleVariables.draft_color,
                weight: this.styleVariables.draft_weight,
                opacity: this.styleVariables.draft_opacity,
                fillColor: this.styleVariables.draft_fill_color,
                fillOpacity: this.styleVariables.draft_fill_opacity,
            };

            return style;
        },
        activeLayerDraftStyle() {
            const style = {
                opacity: 0,
                fillOpacity : 0
            };

            return style;
        }
    },
    watch: {
        info: {
            handler: function (info) {
                // If the info object is not empty, this means that the user has
                // some permissions. First, we check if the user has the
                // permission to create an entity, and if so, we set the
                // createPermission property to true.
                if (Object.keys(info).length > 0) {
                    const createPermission = this.info.entity_type_permission.find(p => p.create == '1');
                    if (createPermission) this.createPermission = true;
                }
            },
            deep: true,
        },
        mapPoint: {
            handler: function (point) {
                // check if the point is valid
                if (point) {
                    // if the point is valid, set the point
                    this.setPoint(point);
                }
            },
            deep: true,
        },
    },
    methods: {
        // Set the searchingPoint attribute to true or false
        getPoint() {
            // Set the searchingPoint attribute to true or false
            this.searchingPoint = !this.searchingPoint;

            // Emit the point-mode event with the string 'form-point'
            if(this.searchingPoint) {
                this.$emit('point-mode', 'form-point');
            }

            // If the user is no longer searching for a point, clear the point attribute
            // and emit the point-mode event with an empty string
            if (!this.searchingPoint) {
                this.point = this.pointStructure.features[0].geometry.coordinates = [];

                this.$emit('point-mode', '');
            }
        },
        // Set the point attribute
        setPoint(point) {
            if (point) {
                let lat = point.lat;
                let lng = point.lng;

                // The coordinates array is in the format [longitude, latitude]
                let coordinates = [lng, lat];
                let pointStructure;

                // Create a copy of the pointStructure object
                pointStructure = JSON.parse(JSON.stringify(this.pointStructure))
                pointStructure["features"][0]["geometry"]["coordinates"] = coordinates;

                this.point = pointStructure;

                // Send the data to the form
                this.sendDataForm(point);
            }
        },
        sendDataForm(point) {
            // check if point exists
            if (point) {
                // get the columns for lat and lng
                const latCol = this.info.columns.find(c => c.format === 'LATITUDE');
                const lngCol = this.info.columns.find(c => c.format === 'LONGITUDE');

                if (!latCol || !lngCol) {
                    console.error("No se encontraron las columnas de latitud y longitud. Debe crear las columnas en Sheets con formato 'LATITUDE' y 'LONGITUDE' para poder abrir formularios desde el mapa.");
                    
                    this.$emit('point-mode', '');

                    return;
                }

                // create params object with lat and lng values
                let params = {};
                params[latCol.col_name] = point.lat;
                params[lngCol.col_name] = point.lng;

                // emit data-form event with params
                this.$emit('data-form', {
                    type: "open_form",
                    content: {
                        form_id: this.info.entity_type.create_form_id || this.info.entity_type.id,
                        record_id: '',
                        params: params
                    }
                });

                // emit point-mode event with empty string
                this.$emit('point-mode', '');
            }
        },
    },
}
</script>

<style>

.my-map-container.drawing >>> .leaflet-interactive:not(.polygon_draft_circle_marker){
    cursor: crosshair !important;
}
button.get-point-btn {
    background-color: var(--sh-map-zoom-button-background-color);
    color: var(--sh-map-zoom-button-text-color);
    border-radius: var(--sh-map-radius-multiplier);
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
