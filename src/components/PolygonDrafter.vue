<template>
    <div>
        <!-- Polygon draft -->
        <div v-if="polygon_draft ">
            <l-geo-json :geojson="polygon_draft"></l-geo-json>
        </div>
        <!-- Polygon draft -->
        
        <!-- Polygon drawing-->
        <div v-if="Object.keys(polygon_arr).length > 0">
            <div v-for="(polygon, index) in polygon_arr" :key="index">
                <l-geo-json :geojson="polygon" ></l-geo-json>
            </div>
        </div>
        <!-- Polygon drawing -->
    </div>
</template>
<script>
import {LGeoJson} from 'vue2-leaflet';

export default {
    name: "PolygonDrafter",
    props: {
        info           : Object
    },
    components: {
        LGeoJson
    },
    data () {
        return {
            drawing              : false,
            polygon_arr          : {}, 
            polygon_arr_id_cont  : 0, 
            polygon_draft        : undefined,
            polygon_draft_length : 0,
            bounds_filters       : []
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
        }
    },
    watch : {
        bounds_filters:{
          handler() {
              this.$emit('apply-filter', this.bounds_filters);
          },
          deep: true
        }
    },
    methods:{
        polygonBounds(){

            let search = [];

            for (const [key, geojson] of Object.entries(this.polygon_arr)) {
              console.log(key);
                search.push(geojson.features[0].geometry.coordinates[0]);
            }

            let all_col  = this.info.columns;

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

            this.bounds_filters = bounds_filters;
        },
        draw(){
            this.drawing = (this.drawing == false);
            if (!this.drawing && this.polygon_draft) {
                if (this.polygon_draft_length > 2) {
                    let polygon_id = "ID"+this.polygon_arr_id_cont;

                    this.polygon_draft["features"][0]["properties"]["id"] = polygon_id;

                    this.polygon_arr[polygon_id] = this.polygon_draft;

                    this.polygon_arr_id_cont ++;

                    this.polygon_draft_length = 0;
                    this.polygon_draft        = undefined;
                }else{
                    console.log("Esta funcionalidad esta hecha solo para poligonos, por favor completa la linea con algunas otras coordenadas");
                }
            }
            this.polygonBounds();

        },
        addPolygon(event){
            if (this.drawing) {
                // Tomamos las ultimas coordenadas seleccionadas
                let lat = event.latlng.lat;
                let lng = event.latlng.lng;

                let coordinates = [lng, lat];
                let polygon_structure;

                if (!this.polygon_draft) {
                    // Si no existe ningun borrador del poligono tomamos su estructura base y generamos uno
                    polygon_structure = JSON.parse(JSON.stringify(this.polygon_structure))
                    polygon_structure["features"][0]["geometry"]["type"]        = "Point";
                    polygon_structure["features"][0]["geometry"]["coordinates"] = coordinates;
                    this.polygon_draft = polygon_structure;
                    this.polygon_draft_length = 1;

                }else{
                    // Si existe calculamos su largo para saber si tiene mas de 3 puntos dentro de si
                    
                    let length = this.polygon_draft_length;
                    //Si solo hemos agregado uno
                    if (length < 2) {
                        let first_coordinate = this.polygon_draft["features"][0]["geometry"]["coordinates"];
                        this.polygon_draft["features"][0]["geometry"]["type"]        = "LineString";
                        this.polygon_draft["features"][0]["geometry"]["coordinates"] = [first_coordinate, coordinates];

                    }
                    // Si tiene dos puntas cambiamos su estado por ultima vez a poligono y agrandamos una vez mas el array de las coordenadas
                    else if (length == 2) {

                        let all_coordinates  = JSON.parse(JSON.stringify(this.polygon_draft["features"][0]["geometry"]["coordinates"]));
                        all_coordinates.push(coordinates);
                        let first_coordinate = all_coordinates[0];
                        
                        this.polygon_draft["features"][0]["geometry"]["coordinates"]              = [all_coordinates];
                        this.polygon_draft["features"][0]["geometry"]["coordinates"][0][length+1] = first_coordinate;
                        this.polygon_draft["features"][0]["geometry"]["type"]                     = "Polygon";

                    }else if (length > 2) {
                        //Para los siguientes eliminamos la ultima coordenada y la volvemos a agregar despues de haber agregado la coordenada actual
                        let first_coordinate = this.polygon_draft["features"][0]["geometry"]["coordinates"][0].pop();

                        this.polygon_draft["features"][0]["geometry"]["coordinates"][0][length]   = coordinates;
                        this.polygon_draft["features"][0]["geometry"]["coordinates"][0][length+1] = first_coordinate;

                    }
                    this.polygon_draft_length ++;
                }

            }

        },
        deletePolygon(){
            this.polygon_arr          = {};
            this.polygon_arr_id_cont  = 0;
            this.polygon_draft        = undefined;
            this.polygon_draft_length = 0;
            this.bounds_filters       = [];
        }
    }
}
</script>
<style>

</style>
