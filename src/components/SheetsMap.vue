<template>
    <div>

        <div>
            <l-map style="height: 80vh;" :zoom="zoom" :center="center">
                <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
                <l-marker :lat-lng="markerLatLng"></l-marker>
            </l-map>
        </div>
        <div>
            <h3>Sheets Map</h3>
            <ul>
                <li>id: {{id}} </li>
                <li>entity_type_id: {{entity_type_id}} </li>
                <li>config_entity_id: {{config_entity_id}} </li>
                <li>endpoint_config: {{endpoint_config}} </li>
                <li>code: {{code}} </li>
                <li>active_filters: {{active_filters}} </li>
            </ul>
        </div>
    </div>
        
</template>

<script>

// import L from 'leaflet';
import {LMap, LTileLayer, LMarker} from 'vue2-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default {
    name: 'SheetsMap',
    components: {
        LMap,
        LTileLayer,
        LMarker,
    },
    props: {
        id: String,
        entity_type_id: String,
        config_entity_id: String,
        endpoint_config: String,
        code: String,
        active_filters: Object
    },
    data () {
        return {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution:
                '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            zoom: 10,
            center: [51.505, -0.159],
            markerLatLng: [51.504, -0.159]
        };
    },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

li {
    text-align: left;
    margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
