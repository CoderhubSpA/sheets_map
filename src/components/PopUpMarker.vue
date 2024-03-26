<template>
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
                <a v-if="col.format === 'URL[GENERATED]'" :href="generateURL" rel="noopener noreferrer" target="_blank" class="marker-pop-up-info-content">
                    ver parte
                </a>
                <span v-else class="marker-pop-up-info-content">
                    {{ getPopupData(marker, col) }}
                </span>
            </div>
            <div v-if="getFormColFormat">
                <span class="marker-pop-up-info-title">
                    <b>Editar registro</b>
                </span>
                <br />
                <span class="marker-pop-up-info-content">
                    <a href="#" onclick="return false;">
                        <b-icon icon="pencil" @click="setForm(marker.id)" />
                    </a>
                </span>
            </div>
        </div>
        <div v-else class="marker-pop-up-single-info">Cargando...</div>
    </l-popup>
</template>

<script>
import { LPopup } from "vue2-leaflet";

import { BIcon } from "bootstrap-vue";

export default {
    name: "PopUpMarker",
    components: {
        LPopup,
        BIcon,
    },
    props: {
        marker: Object,
        info: Object,
        visible_columns: Array,
        entity_type_id: String,
        popup_point_options: Object,
    },
    computed: {
        getFormColFormat() {
            const getFormColFormat = this.info.columns.find((column) => {
                return (column.format = "FORM");
            });

            return getFormColFormat ? true : false;
        },
        generateURL() {
            return `http://sheets.local/sait/generateURL/${this.info.entity_type.id}/${this.marker.data["id"]}`;
        },
    },
    methods: {
        getPopupData(marker, col) {
            return marker.data[col.id] === "NULL" ? "-" : marker.data[col.id];
        },
        setForm(markerId) {
            if (
                this.info.entity_type.update_form_id ||
                this.info.entity_type.create_form_id ||
                (this.info.entity_type.id && markerId)
            ) {
                this.$emit("form", {
                    type: "open_form",
                    content: {
                        form_id:
                            this.info.entity_type.update_form_id ||
                            this.info.entity_type.create_form_id ||
                            this.info.entity_type.id,
                        record_id: markerId,
                    },
                });
            }
        }
    },
};
</script>

<style scoped>
.marker-pop-up {
    min-width: 150px;
    max-height: 350px;
}
.marker-pop-up-content {
    max-height: 350px;
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

.marker-pop-up-single-info {
    font: var(--sh-map-marker-pop-up-content-font);
    color: var(--sh-map-marker-pop-up-content-color);
}
.marker-pop-up-info-title {
    font: var(--sh-map-marker-pop-up-title-font);
    color: var(--sh-map-marker-pop-up-title-color);
}
.my-map >>> .leaflet-popup-content-wrapper,
.my-map >>> .leaflet-popup-tip {
    background-color: var(--sh-map-marker-pop-up-background);
    border-color: var(--sh-map-marker-pop-up-border-color);
    border-width: var(--sh-map-marker-pop-up-border-width);
    border-style: var(--sh-map-marker-pop-up-border-style);
    min-width: 200px;
}
</style>
