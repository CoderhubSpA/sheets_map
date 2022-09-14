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

const getAddressFromNode = (xmlAddressNode) => {
  const tags = ["ID", "DireccionOrPOI", "Latitud", "Longitud"];
  return tags.reduce((address, tag) => {
    address[tag] = xmlAddressNode.querySelector(tag).textContent.trim();
    return address;
  }, {});
};

const fetchSearchType = async (searchString, searchUrl, abortSignal) => {
  const headers = new Headers();
  headers.append("Content-Type", "text/xml");

  const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap="https://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
      <GetTipo xmlns="http://tempuri.org/">
          <busqueda>${searchString}</busqueda>
      </GetTipo>
  </soap:Body>
</soap:Envelope>`;

  const requestOptions = {
    method: "POST",
    headers: headers,
    body,
    redirect: "follow",
    signal: abortSignal,
  };
  const response = await fetch(searchUrl, requestOptions);

  const parser = new DOMParser();
  const xml = parser.parseFromString(await response.text(), "text/xml");
  return xml.querySelector("GetTipoResult").textContent.trim();
};

const fetchAddresses = async (
  searchString,
  searchType,
  searchUrl,
  searchCountry,
  maxResults,
  abortSignal
) => {
  const headers = new Headers();
  headers.append("Content-Type", "text/xml");

  const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap="https://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <FindDireccionesTextLibre xmlns="http://tempuri.org/">
        <busqueda>${searchString}</busqueda>
        <tipo>${searchType}</tipo>
        <pais>${searchCountry}</pais>
        <canResultados>${maxResults}</canResultados>
    </FindDireccionesTextLibre>
  </soap:Body>
</soap:Envelope>`;

  const requestOptions = {
    method: "POST",
    headers: headers,
    body,
    redirect: "follow",
    signal: abortSignal,
  };

  const response = await fetch(searchUrl, requestOptions);

  const parser = new DOMParser();
  const xml = parser.parseFromString(await response.text(), "text/xml");
  return Array.from(xml.querySelectorAll("DireccionTextLibre")).map(
    getAddressFromNode
  );
};

export default {
  name: "SAITSearchBar",
  components: {
    SearchBar,
  },
  props: {
    /**
     * @typedef {object} SearchConfig
     * @property {string} search_type_url
     * @property {string} search_address_url
     * @property {string} search_country
     * @property {number} search_max_results
     */
    /** @type {SearchConfig} */
    config: Object,
  },
  data() {
    return {
      searchString: "",
      suggestions: [],
      currentAbortController: null,
    };
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
      const {
        search_type_url,
        search_addresses_url,
        search_country,
        search_max_results,
      } = this.config;
      try {
        const searchType = await fetchSearchType(
          searchString,
          search_type_url,
          signal
        );
        this.suggestions = await fetchAddresses(
          searchString,
          searchType,
          search_addresses_url,
          search_country,
          search_max_results,
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
