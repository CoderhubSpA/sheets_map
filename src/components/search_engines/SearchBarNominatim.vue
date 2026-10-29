<template>
    <div class="search-bar-nominatim" :class="[{'has-suggestions': hasResultsPanel}]">
        <b-input-group>
            <input
                class="search-input form-control"
                type="text"
                placeholder="Ingrese un lugar o latitud, longitud"
                title="Buscar una dirección, comuna, provincia, región o coordenadas"
                v-model="addressOrLocation"
                :disabled="loading"
                @keydown.enter.prevent="search"
                @input="handleInput"
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
                    type="button"
                    :disabled="loading"
                    @click="search"
                >
                    <b-icon :icon="loading ? 'hourglass-split' : 'search'" />
                </b-button>
            </b-input-group-append>
        </b-input-group>
        <div class="suggestions" v-show="hasResultsPanel">
            <p v-if="message" class="search-message">{{ message }}</p>
            <ul v-if="results.length > 0">
                <li
                    v-for="(place, index) in results"
                    :key="index"
                    :title="place.label"
                    @click="selectPlace(place)"
                >
                    {{ place.label }}
                </li>
            </ul>
            <small class="search-panel-attribution">Búsqueda © OpenStreetMap</small>
        </div>
        <!-- Atribución exigida por la licencia ODbL de los datos de OpenStreetMap. -->
        <small class="search-attribution">
            Búsqueda ©
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
        </small>
    </div>
</template>

<script>
import { BIcon, BButton, BInputGroupAppend, BInputGroup } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import { createPlaceSearch } from "./placeSearch.js";

const MESSAGES = Object.freeze({
    EMPTY: "No se encontraron lugares",
    BUSY: "El buscador está ocupado, intenta en unos segundos",
    FAILED: "No se pudo consultar el buscador",
});

export default {
    name: "SearchBarNominatim",
    components: {
        BIcon,
        BButton,
        BInputGroupAppend,
        BInputGroup,
    },
    props: {
        config: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            addressOrLocation: "",
            results: [],
            message: "",
            loading: false,
        };
    },
    computed: {
        hasResultsPanel() {
            return this.results.length > 0 || Boolean(this.message);
        },
    },
    created() {
        // No reactivo: solo decide qué búsqueda puede actualizar la interfaz.
        this.placeSearch = createPlaceSearch();
    },
    beforeDestroy() {
        this.placeSearch.invalidate();
    },
    methods: {
        clearSearch() {
            // Una respuesta que llegue después de borrar ya no repuebla la lista ni mueve el mapa.
            this.placeSearch.invalidate();
            this.loading = false;
            this.addressOrLocation = "";
            this.results = [];
            this.message = "";
        },
        handleInput() {
            // No se autocompleta: solo se limpian resultados viejos al editar.
            this.results = [];
            this.message = "";
        },
        async search() {
            // Se ignoran nuevas búsquedas mientras hay una en curso.
            if (this.loading) return;

            const query = String(this.addressOrLocation || "").trim();
            if (!query) return;

            this.results = [];
            this.message = "";
            this.loading = true;

            const outcome = await this.placeSearch.run(query, this.config || {});
            // Se borró la búsqueda o se destruyó el componente mientras se esperaba.
            if (!outcome) return;

            this.loading = false;
            if (outcome.kind === "coordinates") {
                this.$emit("change-location", outcome.coordinates);
            } else if (outcome.kind === "places") {
                // También con un único lugar: la persona elige en la lista antes de mover el mapa.
                this.results = outcome.places;
            } else if (outcome.kind === "empty") {
                this.message = MESSAGES.EMPTY;
            } else {
                console.error("SearchBarNominatim error:", outcome.error);
                this.message = outcome.kind === "busy" ? MESSAGES.BUSY : MESSAGES.FAILED;
            }
        },
        selectPlace(place) {
            this.results = [];
            this.message = "";
            this.addressOrLocation = place.label;
            // change-location primero, como respaldo para anfitriones que no manejan
            // change-bounds; si el anfitrión sí lo maneja, el encuadre reemplaza al centrado.
            this.$emit("change-location", [place.lat, place.lon]);
            if (place.bounds) {
                this.$emit("change-bounds", place.bounds);
            }
        },
    },
};
</script>

<style lang="scss">
$text-color: #303030;
$muted-color: #606060;
$border-radius: 8px;
$background-color: #ffffff;
$selected-background-color: #e4e4e4;

.search-bar-nominatim {
    position: relative;
    width: Min(100%, 320px);
    height: 38px !important;
    margin: 0 0 10px 0;
    z-index: 1000;
    background-color: $background-color;
    border-radius: $border-radius;

    &.has-suggestions {
        border-radius: $border-radius $border-radius 0 0 !important;
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
        max-height: 300px;
        overflow-y: auto;
        padding: 0;
        margin: 0;
        color: $text-color;
        background-color: $background-color;
        border-radius: 0 0 $border-radius $border-radius;
        font-size: 14px;
        text-align: left;

        > ul {
            padding: 0;
            margin: 0;
            list-style: none;
        }

        li {
            padding: 8px;
            cursor: pointer;
        }

        li:hover {
            background-color: $selected-background-color;
        }

        li:last-child {
            border-radius: 0 0 $border-radius $border-radius;
        }

        .search-panel-attribution {
            display: block;
            padding: 2px 8px 4px;
            font-size: 10px;
            color: $muted-color;
            text-align: right;
        }

        .search-message {
            padding: 8px;
            margin: 0;
            color: $muted-color;
        }
    }

    .search-attribution {
        position: absolute;
        right: 4px;
        bottom: -16px;
        font-size: 10px;
        line-height: 14px;
        color: $muted-color;
        background-color: rgba(255, 255, 255, 0.7);
        padding: 0 4px;
        border-radius: 4px;

        a {
            color: inherit;
        }
    }

    &.has-suggestions .search-attribution {
        display: none;
    }
}
</style>
