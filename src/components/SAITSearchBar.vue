<template>
  <search-bar
    v-model="searchString"
    :suggestions="suggestions"
    :getSuggestionDisplayValue="(address) => address['DireccionOrPOI']"
    :getSuggestionId="(address) => address['ID']"
    @search="changeLocation"
  />
</template>

<script>
import SearchBar from "./SearchBar.vue";
import _ from "lodash";

const fetchAddresses = async (
  searchString,
  url,
  country,
  maxResults,
  csrfToken,
  abortSignal
) => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (csrfToken) headers.append("X-CSRF-TOKEN", csrfToken);

  const body = JSON.stringify({
    search_string: searchString,
    url,
    country,
    max_results: maxResults,
  });

  const requestOptions = {
    method: "POST",
    headers: headers,
    body,
    redirect: "follow",
    signal: abortSignal,
    credentials: "same-origin",
  };

  const base = location.origin;
  const response = await fetch(base + "/sait/addresses", requestOptions);

  /**
   * @typedef {object} Address
   * @property {string} ID
   * @property {string} DireccionOrPOI
   * @property {string} Tipo
   * @property {string} Pais
   * @property {string} Latitud
   * @property {string} Longitud
   * @property {string} Calle
   * @property {string} Comuna
   * @property {string} IdTipo
   */

  /** @type {Address[]} */
  const addresses = await response.json();
  return addresses;
};

export default {
  name: "SAITSearchBar",
  components: {
    SearchBar,
  },
  props: {
    /**
     * @typedef {object} SearchConfig
     * @property {string} url La url para obtener opciones de autocompletar.
     * @property {string} country
     * @property {number} max_results
     */
    /** @type {SearchConfig} */
    config: Object,
  },
  data() {
    return {
      searchString: "",
      suggestions: [],
      currentAbortController: null,
      csrfToken: null,
    };
  },
  mounted() {
    this.csrfToken = document
      .querySelector('meta[name="csrf-token"')
      ?.getAttribute("content");
  },
  watch: {
    searchString(newValue) {
      if (newValue === "") {
        this.suggestions = [];
        return;
      }
      this.getSuggestions(this);
    },
  },
  methods: {
    getSuggestions: _.throttle(async function () {
      this.currentAbortController?.abort();
      this.currentAbortController = new AbortController();
      const { signal } = this.currentAbortController;
      const { searchString } = this;
      const { url, country, max_results } = this.config;
      try {
        this.suggestions = await fetchAddresses(
          searchString,
          url,
          country,
          max_results,
          this.csrfToken,
          signal
        );
        this.currentAbortController = null;
      } catch (error) {
        if (error.name !== "AbortError") console.debug(error);
      }
    }, 500),
    changeLocation(selectedSuggestionIndex) {
      if (this.suggestions.length === 0) return;

      const suggestion = this.suggestions[selectedSuggestionIndex];
      const { Latitud, Longitud, DireccionOrPOI } = suggestion;

      this.searchString = DireccionOrPOI;

      const parse = (string) => parseFloat(string.replace(",", "."));
      const latLng = [parse(Latitud), parse(Longitud)];
      this.$emit("change-location", latLng);
    },
  },
};
</script>

<style></style>
