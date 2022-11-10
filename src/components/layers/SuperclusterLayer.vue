<template>
    <l-layer-group :visible="visible" ref="lgroup">
        <l-marker
            v-for="(cluster, index) in clusters"
            v-bind:key="index"
            :lat-lng="cluster.lat_lng"
        >
            <l-icon
                :icon-anchor="[40, 40]"
                :class-name="'marker-cluster marker-cluster-' + cluster.size"
            >
                <div class="headline">
                    <span>
                        {{ cluster.properties.point_count_abbreviated }}</span
                    >
                </div>
            </l-icon>
        </l-marker>
        <l-circle-marker
            ref="circlemarker"
            v-for="(marker, index) in markers"
            :key="'marker-' + index"
            :lat-lng="marker.lat_lng"
            :radius="3"
            v-on:click="getMarkerData(marker)"
            color="#00642a"
        >
            <!-- https://leafletjs.com/reference.html#popup-->
            <l-popup :options="popup_point_options" class="marker-pop-up">
                <div v-if="marker.has_data" class="marker-pop-up-content">
                    <div
                        v-for="(col, key) in visible_columns"
                        :key="'col-' + key"
                        class="marker-pop-up-single-info"
                    >
                        <span class="marker-pop-up-info-title">
                            <b>{{ col.name }}</b>
                        </span>
                        <br />
                        <span class="marker-pop-up-info-content">
                            {{ getPopupData(marker, col) }}
                        </span>
                    </div>
                </div>
                <div v-else class="marker-pop-up-single-info">Cargando...</div>
            </l-popup>
        </l-circle-marker>
    </l-layer-group>
</template>
<script>
import _ from "lodash";
import Supercluster from "supercluster";
import axios from "axios";
import {
    LLayerGroup,
    LMarker,
    LCircleMarker,
    LPopup,
    LIcon,
} from "vue2-leaflet";

export default {
    data() {
        return {
            index: undefined,
            popup_point_options: {
                maxWidth: 300,
                minWidth: 300,
                maxHeight: 300,
                autoPan: false,
                className: 'popupCustom'
            },
            markers_data: {},
            clusters_markers: []
        };
    },
    components: {
        LLayerGroup,
        LCircleMarker,
        LPopup,
        LIcon,
        LMarker,
    },
    props: {
        info: Object,
        map: Object,
        data: Object,
        config: Object,
        col_lat: String,
        col_lng: String,
        entity_type_id: String,
        base_url: String,
        visible: Boolean,
    },
    computed: {
        geo_json() {
            // Al recibir data, geo_json se construye a partir de esa data
            // y las columnas configuradas como lat y lng
            let geo_json = { type: "FeatureCollection", features: [] };

            if (!this.data.data || !this.col_lat || !this.col_lng)
                return geo_json;

            geo_json.features = this.data.data
                .map((d) => {
                    try {
                        let lat = d[this.col_lat];
                        let lng = d[this.col_lng];

                        lat =
                            typeof lat == "string"
                                ? parseFloat(lat.replace(/,/, "."))
                                : lat;
                        lng =
                            typeof lng == "string"
                                ? parseFloat(lng.replace(/,/, "."))
                                : lng;

                        if (!lat || !lng) return;

                        let coordinates = [lng, lat];
                        // let coordinates = [marker.lat_lng[1],marker.lat_lng[0]];
                        return {
                            type: "Feature",
                            properties: {
                                id: d.id,
                            },
                            geometry: {
                                type: "Point",
                                coordinates: coordinates,
                            },
                        };
                    } catch (error) {
                        console.error(error);
                    }
                })
                .filter((d) => d);

            return geo_json;
        },
        //Supercluster
        clusters() {
            let clusters = this.clusters_markers
                .map((d) => {
                    if (d.properties.cluster) {
                        let count = d.properties.point_count;
                        let size =
                            count <
                            this.config.sh_map_medium_cluster_size_starts_at
                                ? "small"
                                : count <
                                  this.config
                                      .sh_map_large_cluster_size_starts_at
                                ? "medium"
                                : "large";

                        d.properties.point_count_abbreviated =
                            d.properties.point_count_abbreviated > 900
                                ? "900+"
                                : d.properties.point_count_abbreviated;
                        return {
                            lat_lng: [
                                d.geometry.coordinates[1],
                                d.geometry.coordinates[0],
                            ],
                            properties: d.properties,
                            size: size,
                        };
                    }
                })
                .filter((d) => d);
            return clusters;
        },
        markers() {
            let markers = this.clusters_markers
                .map((d) => {
                    if (!d.properties.cluster) {
                        return {
                            lat_lng: [
                                d.geometry.coordinates[1],
                                d.geometry.coordinates[0],
                            ],
                            id: d.properties.id,
                            data: this.markers_data[d.properties.id] || {},
                            has_data: !_.isEmpty(
                                this.markers_data[d.properties.id]
                            ),
                        };
                    }
                })
                .filter((d) => d);
            return markers;
        },
        // POSIBLEMENTE NO SE NECESITE
        markers_latlgn() {
            if (!this.data.data || !this.col_lat || !this.col_lng) return [];
            return [];
        },
        visible_columns(){
            if(!this.info.columns) return [];
            
            let all_columns = this.info.columns;
            let visible_columns = all_columns.filter( c => {
                if (c.visible == 1) {
                    return c;
                }
            })
            .filter(d => d);
            return visible_columns;
        },
    },
    created() {
        this.index = new Supercluster({
            radius: 40, // clusterizar en un radio de (radio es relativo al zoom)
            maxZoom: 17, // Maximo zoom a clusterizar
        });
        this.index.load([]);
    },
    watch: {
        geo_json() {
            this.index.load(this.geo_json.features);
            this.getClusterMarkers();
        },
        markers() {
            if (this.center_default != this.center) return;
            const total = this.markers.length;
            if (!total) return this.center_default;
            const markers_sum = this.markers.reduce(
                (acc, d) => {
                    acc[0] = acc[0] + d.lat_lng[0];
                    acc[1] = acc[1] + d.lat_lng[1];
                    return acc;
                },
                [0, 0]
            );

            this.center = [markers_sum[0] / total, markers_sum[1] / total];
        },
    },
    methods: {
        getMarkerData(marker) {
            const url = `${this.base_url}/entity/data/${this.entity_type_id}/${marker.id}?page=1`;
            axios
                .get(url)
                .then((response) => {
                    try {
                        let all_data = response.data.content;
                        let marker_data = _.first(all_data.data) || {};
                        this.$set(this.markers_data, marker.id, marker_data);
                    } catch (error) {
                        console.error(error);
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    console.log("done data");
                });
        },
        getPopupData(marker,col){
            return (marker.data[col.id] === 'NULL') ? '-' : marker.data[col.id];
        },
        getClusterMarkers() {
            let bounds = this.map.getBounds();
            let bbox = [
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getNorth(),
            ];
            let zoom = this.map.getZoom();

            let clusters_markers = this.index.getClusters(bbox, zoom);

            this.clusters_markers = clusters_markers;
        },
    },
};
</script>
<style scoped>
    .marker-cluster-small {
        background-color: var(--sh-map-point-cluster-small-color);
    }
    .marker-cluster-small div {
        background-color: var(--sh-map-point-cluster-small-color-div);
        width:            var(--sh-map-point-cluster-small-size);
        height:           var(--sh-map-point-cluster-small-size);
        font:             var(--sh-map-point-cluster-small-font);
        color:            var(--sh-map-point-cluster-small-font-color);
        border-style:     var(--sh-map-point-cluster-small-border-style);
        border-width:     var(--sh-map-point-cluster-small-border-width);
        border-color:     var(--sh-map-point-cluster-small-border-color);
    }

    .marker-cluster-medium {
        background-color: var(--sh-map-point-cluster-medium-color);
    }
    .marker-cluster-medium div {
        background-color: var(--sh-map-point-cluster-medium-color-div);
        width:            var(--sh-map-point-cluster-medium-size);
        height:           var(--sh-map-point-cluster-medium-size);
        font:             var(--sh-map-point-cluster-medium-font);
        color:            var(--sh-map-point-cluster-medium-font-color);
        border-style:     var(--sh-map-point-cluster-medium-border-style);
        border-width:     var(--sh-map-point-cluster-medium-border-width);
        border-color:     var(--sh-map-point-cluster-medium-border-color);
    }

    .marker-cluster-large {
        background-color: var(--sh-map-point-cluster-large-color);
    }
    .marker-cluster-large div {
        background-color: var(--sh-map-point-cluster-large-color-div);
        width:            var(--sh-map-point-cluster-large-size);
        height:           var(--sh-map-point-cluster-large-size);
        font:             var(--sh-map-point-cluster-large-font);
        color:            var(--sh-map-point-cluster-large-font-color);
        border-style:     var(--sh-map-point-cluster-large-border-style);
        border-width:     var(--sh-map-point-cluster-large-border-width);
        border-color:     var(--sh-map-point-cluster-large-border-color);
    }


    .marker-cluster {
        background-clip: padding-box;
        border-radius: 20px;
    }
    .marker-cluster div {
        margin-left: 5px;
        margin-top: 5px;
        text-align: center;
        border-radius: 100%;
    }
    .marker-cluster span {
        line-height: var(--sh-map-point-cluster-small-size);
    }
    .marker-cluster-medium span {
        line-height: var(--sh-map-point-cluster-medium-size);
    }
    .marker-cluster-large span {
        line-height: var(--sh-map-point-cluster-large-size);
    }

    .marker-pop-up-content{
        max-height:350px;
        overflow-y: scroll;
    }
    .marker-pop-up-content::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    .marker-pop-up-content::-webkit-scrollbar-thumb {
        background: var(--sh-map-marker-pop-up-srcoll-color);
        border-radius: 4px;
    }

    .marker-pop-up-content::-webkit-scrollbar-thumb:hover {
        background: var(--sh-map-marker-pop-up-srcoll-color-hover);
    }

    .marker-pop-up-content::-webkit-scrollbar-thumb:active {
        background-color: var(--sh-map-marker-pop-up-srcoll-color-active);
    }


    .marker-pop-up-single-info{
        font:  var(--sh-map-marker-pop-up-content-font);
        color: var(--sh-map-marker-pop-up-content-color);
    }
    .marker-pop-up-info-title{
        font:  var(--sh-map-marker-pop-up-title-font);
        color: var(--sh-map-marker-pop-up-title-color);
    }

    .my-map >>> .leaflet-popup-content-wrapper,
    .my-map >>> .leaflet-popup-tip{
        background-color: var(--sh-map-marker-pop-up-background);
        border-color : var(--sh-map-marker-pop-up-border-color);
        border-width : var(--sh-map-marker-pop-up-border-width);
        border-style : var(--sh-map-marker-pop-up-border-style);
    }

</style>