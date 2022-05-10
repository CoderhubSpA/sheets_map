<template>

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
    
</template>

<script>

import {LMap, LTileLayer, LMarker} from 'vue2-leaflet';

export default {
    name: 'SheetsMap',
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
