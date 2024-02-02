<template>
    <div>
        <!-- Polygon draft -->
        <!-- <div v-if="polygon_draft ">
            <l-geo-json :geojson="polygon_draft" :options-style="draft_style"></l-geo-json>
        </div> -->
        <!-- Polygon draft -->
        
        <!-- Polygon drawing-->
        <!-- <div v-if="Object.keys(polygon_arr).length > 0">
            <div v-for="(polygon, index) in polygon_arr" :key="index">
                <l-geo-json :geojson="polygon"></l-geo-json>
            </div>
        </div> -->
        <!-- Polygon drawing -->

        <!-- Circle drawing-->
        <l-circle-marker
            v-if="draft_circle_coordinates.length > 0"
            :lat-lng="draft_circle_coordinates"
            :radius="style_variables['polygon_draft_circle_radius']"
            :color="style_variables['polygon_draft_fill_color']"
            :fillColor="style_variables['polygon_draft_fill_color']"
            :fillOpacity="1"
            className="polygon_draft_circle_marker"
            title="Terminar poligono"
            v-on:click="draw()"
        />
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
        info                   : Object,
        style_variables        : Object,
        analytic_geojson_list  : Array,
        operative_geojson_list : Array,
        map: Object,
    },
    components: {
        LGeoJson,
        LCircleMarker
    },
    data () {
        return {
            drawing              : false,
            polygon_arr          : {}, 
            polygon_arr_id_cont  : 0, 
            polygon_draft        : undefined,
            polygon_draft_length : 0,
            bounds_filters       : [],
            draft_circle_coordinates : [],
            buttons_pressed: {
                marker: false,
                polyline: false,
                delete: false
            },
        };
    }, 
    computed: {
        //Estructura base para poligonos y cuadrados
        polygon_structure(){
            let polygon_structure = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"id":""},
                        "geometry": {
                            "coordinates": [],
                            "type": "Polygon"
                        }
                    }
                ]
            };
            return polygon_structure;
        },
        // draft_style() {

        //         const style = {
        //             fillColor   : this.style_variables['polygon_draft_fill_color'],
        //             weight      : this.style_variables['polygon_draft_weight'],
        //             opacity     : this.style_variables['polygon_draft_opacity'],
        //             color       : this.style_variables['polygon_draft_color'],
        //             dashArray   : this.style_variables['polygon_draft_dash_array'],
        //             fillOpacity : this.style_variables['polygon_draft_fill_opacity']
        //         };


        //         return style;
        // },
        active_layer_draft_style() {

                const style = {
                    opacity     : 0,
                    fillOpacity : 0
                };


                return style;
        }
    },
    watch:{
        map () {
            this.map.pm.setLang("es");
            L.PM.setOptIn(true);
            this.map.on('pm:create', (e) =>  {
                // Creamos el id, y tomamos la layer y el objeto geojson creado
                let polygon_id = "ID"+this.polygon_arr_id_cont;
                const layer = e.layer;
                let geojson = e.shape == "Circle" ? L.PM.Utils.circleToPolygon(layer, 60).toGeoJSON() : layer.toGeoJSON();

                // Agregamos el id al objeto geojson y a la layer, luego lo agregamos al array de poligonos
                layer.properties = polygon_id;
                geojson.properties.id = polygon_id;
                let polygon_structure = JSON.parse(JSON.stringify(this.polygon_structure))
                polygon_structure["features"][0] = geojson; 
                this.polygon_arr[polygon_id] = polygon_structure;
                this.polygon_arr_id_cont ++;
                
                //Configuramos la layer como editable mediante geoman
                layer.options.pmIgnore = false;
                L.PM.reInitLayer(layer);

                // Agregamos los eventos para las modificaciones de la layer
                this.setupLayerEvents(layer);

                // Calculamos los bounds de los poligonos y los emitimos a sheets
                this.polygonBounds();
                this.$emit('apply-filter', this.bounds_filters);
            });
        }
    },
    methods:{
        setupLayerEvents(layer){
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
            layer.on('pm:remove', (e) => {
                let polygon_id = e.layer.properties;
                delete this.polygon_arr[polygon_id];
                this.polygonBounds();
                this.$emit('apply-filter', this.bounds_filters);
            });
        },
        polygonBounds(){

            let search = [];

            for (const [key, geojson] of Object.entries(this.polygon_arr)) {
                console.log(key);
                console.log(geojson);
                search.push(geojson.features[0].geometry.coordinates[0]);
            }

            let all_col  = this.info.columns;
            
            // Not continue if search is empty
            if (search.length == 0) {
                this.bounds_filters = [];
                return;
            }

            let bounds_filters = all_col.filter(columns=>
                columns.format == 'POLYGON'
            ).map((columns,key)=>{

                let bounds_filter = {
                    "column" : columns,
                    "id"     : "external-filter-"+columns.id,
                    "order"  : key+1,
                    "search" : search,
                    "type"   : "POLYGON"
                };
                return bounds_filter;
            });
            console.log(search)
            this.bounds_filters = bounds_filters;

        },
        beginDraw(shape){
            this.map.pm.disableGlobalRemovalMode();
            this.buttons_pressed['delete'] = false;
            this.$emit('button-pressed', this.buttons_pressed);
            switch (shape) {
                case 'marker': {
                    if(this.buttons_pressed["marker"]){
                        this.map.pm.disableDraw();
                    } else {
                        this.map.pm.enableDraw('Marker');
                    }
                    this.buttons_pressed["marker"] = !this.buttons_pressed["marker"];
                    this.$emit('button-pressed', this.buttons_pressed);
                    break;
                }
                case'polyline': {
                    if(this.buttons_pressed["polyline"]){
                        this.map.pm.Draw.Line._finishShape();
                        this.map.pm.disableDraw();
                    } else {
                        this.map.pm.enableDraw('Line');
                    }
                    this.buttons_pressed["polyline"] = !this.buttons_pressed["polyline"];
                    this.$emit('button-pressed', this.buttons_pressed);
                    break;
                }
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
            this.buttons_pressed["delete"] = !this.buttons_pressed["delete"];
            this.$emit('button-pressed', this.buttons_pressed);   
        }
        // draw(){
        //     this.drawing = (this.drawing == false);
        //     if (!this.drawing && this.polygon_draft) {
        //         if (this.polygon_draft_length > 2) {
        //             let polygon_id = "ID"+this.polygon_arr_id_cont;

        //             this.polygon_draft["features"][0]["properties"]["id"] = polygon_id;

        //             this.polygon_arr[polygon_id] = this.polygon_draft;

        //             this.polygon_arr_id_cont ++;

        //             this.resetDraft();
        //         } else {
        //             //Esta funcionalidad esta hecha solo para poligonos, por favor completa la linea con algunas otras coordenadas
        //             this.resetDraft();
        //         }
        //     }

        //     this.polygonBounds();

        //     if(!this.drawing) this.$emit('apply-filter', this.bounds_filters);

        // },
        // addPolygon(event){
        //     if (this.drawing) {
        //         // Tomamos las ultimas coordenadas seleccionadas
        //         let lat = event.latlng.lat;
        //         let lng = event.latlng.lng;

        //         let coordinates = [lng, lat];
        //         let polygon_structure;

        //         if (!this.polygon_draft) {
        //             // Si no existe ningun borrador del poligono tomamos su estructura base y generamos uno
        //             polygon_structure = JSON.parse(JSON.stringify(this.polygon_structure))
        //             polygon_structure["features"][0]["geometry"]["type"]        = "Point";
        //             polygon_structure["features"][0]["geometry"]["coordinates"] = coordinates;
        //             this.polygon_draft = polygon_structure;
        //             this.polygon_draft_length = 1;
        //             this.draft_circle_coordinates = [lat, lng];

        //         }else{
        //             // Si existe calculamos su largo para saber si tiene mas de 3 puntos dentro de si
                    
        //             let length = this.polygon_draft_length;
        //             //Si solo hemos agregado uno
        //             if (length < 2) {
        //                 let first_coordinate = this.polygon_draft["features"][0]["geometry"]["coordinates"];
        //                 this.polygon_draft["features"][0]["geometry"]["type"]        = "LineString";
        //                 this.polygon_draft["features"][0]["geometry"]["coordinates"] = [first_coordinate, coordinates];

        //             }
        //             // Si tiene dos puntas cambiamos su estado por ultima vez a poligono y agrandamos una vez mas el array de las coordenadas
        //             else if (length == 2) {

        //                 let all_coordinates  = JSON.parse(JSON.stringify(this.polygon_draft["features"][0]["geometry"]["coordinates"]));
        //                 all_coordinates.push(coordinates);
        //                 let first_coordinate = all_coordinates[0];
                        
        //                 this.polygon_draft["features"][0]["geometry"]["coordinates"]              = [all_coordinates];
        //                 this.polygon_draft["features"][0]["geometry"]["coordinates"][0][length+1] = first_coordinate;
        //                 this.polygon_draft["features"][0]["geometry"]["type"]                     = "Polygon";

        //             }else if (length > 2) {
        //                 //Para los siguientes eliminamos la ultima coordenada y la volvemos a agregar despues de haber agregado la coordenada actual
        //                 let first_coordinate = this.polygon_draft["features"][0]["geometry"]["coordinates"][0].pop();

        //                 this.polygon_draft["features"][0]["geometry"]["coordinates"][0][length]   = coordinates;
        //                 this.polygon_draft["features"][0]["geometry"]["coordinates"][0][length+1] = first_coordinate;

        //             }
        //             this.polygon_draft_length ++;
        //         }

        //     }

        // },
        // deletePolygon(){
        //     let polygon_ids  = Object.keys(this.polygon_arr);
        //     let last_polygon = polygon_ids.pop();

        //     delete this.polygon_arr[last_polygon];

        //     if (this.polygon_arr == {}) {
        //         this.bounds_filters = [];
        //     }else{
        //         this.polygonBounds()
        //     }

        //     this.resetDraft();

        //     this.$emit('apply-filter', this.bounds_filters);
        // },
        // resetDraft(){
        //     this.polygon_draft            = undefined;
        //     this.polygon_draft_length     = 0;
        //     this.draft_circle_coordinates = [];
        // }
    }
}
</script>
