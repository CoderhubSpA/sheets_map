<template>
    <div class="search-bar-google-map" :class="[{'has-suggestions': suggestions.length > 0}]">
        <b-input-group>
            <!-- Usamos prevent con keydown.down y up para que el cursor (|) no
     se mueva del final al inicio al cambiar de sugerencia. -->
            <input
                class="search-input form-control"
                type="text"
                placeholder="Ingrese una dirección o latitud, longitud"
                title="Buscar una dirección, comuna o zona"
                v-model="addressOrLocation"
                @keydown.enter="getSearchResults(addressOrLocation)"
                @input="handlerInput"
            />
            <b-input-group-append>
                <b-button
                    title="Borrar búsqueda"
                    class="remove-btn"
                    type="button"
                    @click="clearSearch"
                >
                    <b-icon icon="x" />
                </b-button>
                <b-button
                    class="search-btn"
                    title="Buscar"
                    @click="getSearchResults(addressOrLocation)"
                    type="button"
                >
                    <b-icon icon="search" />
                </b-button>
            </b-input-group-append>
        </b-input-group>
        <ul class="suggestions" v-show="suggestions.length > 0">
            <li
                v-for="(suggestion, index) in suggestions"
                :key="index"
                @click="getSearchResults(suggestion.formattedAddress)"
            >
                {{ suggestion.formattedAddress }}
            </li>
        </ul>
    </div>
</template>


<script>
import axios from "axios";
import _ from 'lodash';
import { BIcon, BButton, BInputGroupAppend, BInputGroup } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default {
    name: "SearchBarGoogleMap",
    components: {
        BIcon,
        BButton,
        BInputGroupAppend,
        BInputGroup,
    },
    props: {
        config: {
            type: Object,
            required: true,
            default: () => ({}),
        },
    },
    data() {
        return {
            addressOrLocation: "",
            suggestions: [],
            suggestionsDebounce: null,
            showSuggestions: false,
        };
    },
    methods: {
        clearSearch() {
            this.addressOrLocation = "";
            this.suggestions = [];
        },
        validateCoordinates(string) {
            const coordinatePattern = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;

            if (coordinatePattern.test(string)) {
                const [lat, lon] = this.addressOrLocation.split(",");
                if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                    return true;
                }
            }

            return false;
        },
        handlerInput(event) {
            const search = event.target.value;

            if(!search) {
                this.suggestions = [];

                if (this.suggestionsDebounce) {
                    this.suggestionsDebounce.cancel();
                }
            }

            if(search) {
                if (this.suggestionsDebounce) {
                    this.suggestionsDebounce.cancel();
                }

                this.suggestionsDebounce = _.debounce(() => {
                    if (this.validateCoordinates(search)) {
                        return;
                    } else {
                        this.getSuggestions(search);
                    }
                }, 2000, { leading: false, trailing: true });

                this.suggestionsDebounce();
            }
        },
        getSuggestions() {
            const url = `https://places.googleapis.com/v1/places:searchText`;
            const body = {
                textQuery: this.addressOrLocation,
            };
            const headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": this.config.google_maps_api_key,
                "X-Goog-FieldMask": "places.formattedAddress"
            };

            axios
                .post(url, body, { headers: headers })
                .then((response) => {
                    if (!response.data.places) {
                        return;
                    }
                    this.suggestions = response.data.places;
                })
                .catch((error) => {
                    console.error("SearchBarGoogleMap error:", error);
                });
        },
        getSearchResults(search) {
            if (!search) return;

            this.suggestions = [];

            if (this.validateCoordinates(search)) {
                const [lat, lon] = search.split(",");

                this.$emit("change-location", [lat, lon]);

                return;
            }

            const url = `https://maps.googleapis.com/maps/api/geocode/json?&key=${this.config.google_maps_api_key}&address=${search}`;

            axios
                .get(url)
                .then((response) => {
                    if (response.data && response.data.results.length > 0) {
                        this.sendSearchResults(
                            response.data.results[0].geometry.location
                        );
                    }
                })
                .catch((error) => {
                    console.error("SearchBarGoogleMap error:", error);
                });
        },
        sendSearchResults(data) {
            this.$emit("change-location", [data.lat, data.lng]);
        },
    },
};
</script>

<style lang="scss">
$focus-shadow-color: #cecece80;
$text-color: #303030;
$border-radius: 8px;
$background-color: #ffffff;
$selected-background-color: #e4e4e4;

.search-bar-google-map {
    position: relative;
    top: -3.5%;
    width: Min(100%, 320px);
    height: 38px !important;
    margin: 0 0 0 24px;
    z-index: 1000;
    background-color: $background-color;
    border-radius: $border-radius;

    &.has-suggestions {
        border-radius: $border-radius $border-radius 0 0 !important;
    }

    &.not-overflow {
        overflow: hidden;
    }

    .search-input,
    .search-btn,
    .remove-btn {
        padding: $border-radius;
        height: 36px;
        background-color: $background-color;
        border: none;
        color: $text-color;
    }

    :is(.search-input, .search-btn, .remove-btn):is(:focus:active, :focus) {
        box-shadow: none;
    }

    .search-input {
        border-radius: $border-radius 0 0 $border-radius;
        font-size: 14px;
    }

    .search-input::placeholder {
        color: $text-color;
        font-size: 14px;
    }

    .search-btn,
    .remove-btn {
        font-size: 100%;
    }

    .search-btn {
        border-radius: 0 $border-radius $border-radius;
    }

    .suggestions {
        position: absolute;
        top: 100%;
        width: 100%;
        min-height: 40px;
        max-height: 300px;
        overflow-y: scroll;
        padding: 0;
        margin: 0;
        color: $text-color;
        background-color: $background-color;
        border-radius: 0 0 $border-radius $border-radius;
        list-style: none;
        font-size: 1rem;
        text-align: left;

        > li {
            padding: 8px;
            cursor: pointer;
        }

        > li.selected,
        li:hover {
            background-color: $selected-background-color;
        }

        > li:last-child {
            border-radius: 0 0 $border-radius $border-radius;
        }
    }

    // Separamos estas dos reglas, pues algunos navegadores
    // aún no soportan :has().
    .search-bar:focus-within.show-suggestions {
        border-radius: $border-radius $border-radius 0 0;
    }
    .search-bar:has(.suggestions:hover) {
        border-radius: $border-radius $border-radius 0 0;
    }

    .search-bar:focus-within.show-suggestions .suggestions,
    .suggestions:hover {
        display: block;
    }
}
</style>
