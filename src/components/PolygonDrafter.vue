<template>
    <div>
        <!-- Circle drawing-->
        <l-circle-marker v-if="draft_circle_coordinates.length > 0" :lat-lng="draft_circle_coordinates"
            :radius="style_variables['polygon_draft_circle_radius']" :color="style_variables['polygon_draft_fill_color']"
            :fillColor="style_variables['polygon_draft_fill_color']" :fillOpacity="1"
            className="polygon_draft_circle_marker" title="Terminar poligono" v-on:click="draw()" />
        <!-- Circle drawing-->í
        <div v-if="analytic_geojson_list.length > 0 && drawing">
            <div v-for="analytic_geojson in analytic_geojson_list" :key="analytic_geojson.id">
                <l-geo-json :geojson="analytic_geojson.geojson" :options-style="active_layer_draft_style"></l-geo-json>
            </div>

        </div>
        <!-- End Analytic layers -->

        <!-- Operative layers -->

        <div v-if="operative_geojson_list.length > 0 && drawing">
            <div v-for="operative_geojson in operative_geojson_list" :key="operative_geojson.id">
                <l-geo-json :geojson="operative_geojson.geojson" :options-style="active_layer_draft_style"></l-geo-json>
            </div>
        </div>
    </div>
</template>
<script>
import {
    LGeoJson,
    LCircleMarker
} from 'vue2-leaflet';
import * as L from 'leaflet';
export default {
    name: "PolygonDrafter",
    props: {
        info: Object,
        style_variables: Object,
        analytic_geojson_list: Array,
        operative_geojson_list: Array,
        map: Object,
        draw_is_filter: {
            type: Boolean,
            default: true
        }
    },
    components: {
        LGeoJson,
        LCircleMarker
    },
    data() {
        return {
            drawing: false,
            polygon_arr: {},
            polygon_arr_id_cont: 0,
            layers: [],
            bounds_filters: [],
            draft_circle_coordinates: [],
            buttons_pressed: {
                marker: false,
                polyline: false,
                delete: false
            },
            popupcontents: {},
        };
    },
    computed: {
        //Estructura base para poligonos y cuadrados
        polygon_structure() {
            let polygon_structure = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": { "id": "" },
                        "geometry": {
                            "coordinates": [],
                            "type": "Polygon"
                        }
                    }
                ]
            };
            return polygon_structure;
        },
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
        active_layer_draft_style() {

            const style = {
                opacity: 0,
                fillOpacity: 0
            };


            return style;
        }
    },
    watch: {
        map() {
            this.map.pm.setLang("es");
            L.PM.setOptIn(true);
            this.map.on('pm:create', (e) => {
                // Creamos el id, y tomamos la layer y el objeto geojson creado
                let polygon_id = "ID" + this.polygon_arr_id_cont;
                const layer = e.layer;
                let geojson = e.shape == "Circle" ? L.PM.Utils.circleToPolygon(layer, 60).toGeoJSON() : layer.toGeoJSON();

                // Agregamos el id al objeto geojson y a la layer, luego lo agregamos al array de poligonos
                layer.properties = polygon_id;
                geojson.properties.id = polygon_id;
                let polygon_structure = JSON.parse(JSON.stringify(this.polygon_structure))
                polygon_structure["features"][0] = geojson;
                this.polygon_arr[polygon_id] = polygon_structure;
                this.polygon_arr_id_cont++;
                this.layers.push(layer);

                //Configuramos la layer como editable mediante geoman
                layer.options.pmIgnore = false;
                L.PM.reInitLayer(layer);

                // Agregamos los eventos para las modificaciones de la layer
                this.setupLayerEvents(layer);

                // Calculamos los bounds de los poligonos y los emitimos a sheets
                if (this.draw_is_filter) {
                    this.polygonBounds();
                    this.$emit('apply-filter', this.bounds_filters);
                }
                this.drawing = false;
                this.map.eachLayer((layer) => {
                    if (this.popupcontents[layer._leaflet_id]) {
                        layer.bindPopup(this.popupcontents[layer._leaflet_id]);
                        delete this.popupcontents[layer._leaflet_id];
                    }
                });
            });
        }
    },
    methods: {
        setupLayerEvents(layer) {
            // No esta activada la funcion para actualizar dibujos (edit tool), se mantiene en caso de ser agregado
            layer.on('pm:update', (e) => {
                let polygon_id = e.layer.properties;
                let geojson = e.shape == "Circle" ? L.PM.Utils.circleToPolygon(e.layer, 60).toGeoJSON() : e.layer.toGeoJSON();
                geojson.properties.id = polygon_id;
                let polygon_structure = JSON.parse(JSON.stringify(this.polygon_structure))
                polygon_structure["features"][0] = geojson;
                this.polygon_arr[polygon_id] = polygon_structure;
                this.polygonBounds();
                this.$emit('apply-filter', this.bounds_filters);
            });
            // Evento para borrar poligonos
            layer.on('pm:remove', (e) => {
                // Se toma el id del poligono a partir de la layer, y se borra del arreglo. En caso de que el arreglo quede 
                // vacio se lanza el evento para recalcular los puntos en vista del mapa
                let polygon_id = e.layer.properties;
                delete this.polygon_arr[polygon_id];
                if (Object.keys(this.polygon_arr).length == 0) {
                    this.$emit('drawing-empty');
                } else {
                    this.polygonBounds();
                    this.$emit('apply-filter', this.bounds_filters);
                }
            });
        },
        polygonBounds() {

            let search = [];

            for (const [key, geojson] of Object.entries(this.polygon_arr)) {
                console.log(key);
                console.log(geojson);
                search.push(geojson.features[0].geometry.coordinates[0]);
            }

            let all_col = this.info.columns;

            // Not continue if search is empty
            if (search.length == 0) {
                this.bounds_filters = [];
                return;
            }

            let hasPolygonColumn = all_col.some(column => column.format === 'POLYGON');

            if (!hasPolygonColumn) {
                console.warn('No se encontro columna con formato "POLYGON" en la entidad');
            }
            
            let bounds_filters = all_col.filter(columns =>
                columns.format == 'POLYGON'
            ).map((columns, key) => {

                let bounds_filter = {
                    "column": columns,
                    "id": "external-filter-" + columns.id,
                    "order": key + 1,
                    "search": search,
                    "type": "POLYGON"
                };
                return bounds_filter;
            });
            this.bounds_filters = bounds_filters;

        },
        beginDraw(shape) {
            // this.draw_is_filter = true;
            //Al iniciar un dibujo, desactivamos los popups de puntos y capas, de esta forma, podemos dibujar sin interferencia
            this.map.eachLayer((layer) => {
                layer.closePopup();
                this.popupcontents[layer._leaflet_id] = layer.getPopup();
                layer.unbindPopup();
            });
            //activamos el valor de drawing, y desactivamos el modo de borrado, para empezar a dibujar
            this.drawing = true;
            this.map.pm.disableGlobalRemovalMode();
            this.buttons_pressed['delete'] = false;
            this.$emit('button-pressed', this.buttons_pressed);
            switch (shape) {
                // caso para un marcador, para ser utilizado debe activarse el boton en SheetsMap
                // case 'marker': {
                //     if (this.buttons_pressed["marker"]) {
                //         this.map.pm.disableDraw();
                //     } else {
                //         this.map.pm.enableDraw('Marker');
                //     }
                //     this.buttons_pressed["marker"] = !this.buttons_pressed["marker"];
                //     this.$emit('button-pressed', this.buttons_pressed);
                //     break;
                // }
                case 'polygon': {
                    this.map.pm.enableDraw('Polygon', this.draft_style);

                    break;
                }
                case 'circle': {
                    this.map.pm.enableDraw('Circle', this.draft_style);

                    break;
                }
                case 'rectangle': {
                    this.map.pm.enableDraw('Rectangle', this.draft_style);

                    break;
                }
            }
        },
        toggleDelete() {
            this.map.pm.toggleGlobalRemovalMode();
            this.buttons_pressed["delete"] = !this.buttons_pressed["delete"];
            this.$emit('button-pressed', this.buttons_pressed);
        },
        deleteAll() {
            for (const layer of this.layers) {
                this.map.removeLayer(layer);
            }
            this.polygon_arr = {};
            if (this.draw_is_filter) {
                this.polygonBounds();
                this.$emit('apply-filter', this.bounds_filters);
            }
        },
    }
}
</script>
