<template>
  <search-bar
    v-model="searchString"
    :suggestions="suggestions"
    :getSuggestionDisplayValue="(address) => address['DireccionOrPOI']"
    :getSuggestionId="(address) => address['ID']"
    @search="search"
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

const fetchSearchType = async (searchString, abortSignal) => {
  console.log("buscando");
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
  const response = await fetch(
    "http://0.0.0.0:3000/Ws_Texto_Libre/Service.asmx",
    requestOptions
  );

  const parser = new DOMParser();
  const xml = parser.parseFromString(await response.text(), "text/xml");
  return xml.querySelector("GetTipoResult").textContent.trim();
};

const fetchAddresses = async (searchString, searchType, abortSignal) => {
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
        <pais>Chile</pais>
        <canResultados>10</canResultados>
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

  const response = await fetch(
    "http://0.0.0.0:3000/Ws_Texto_Libre/Service.asmx",
    requestOptions
  );

  const parser = new DOMParser();
  const xml = parser.parseFromString(await response.text(), "text/xml");
  return Array.from(xml.querySelectorAll("DireccionTextLibre")).map(
    getAddressFromNode
  );
};

const getSuggestions = _.debounce(async function (component) {
  component.currentAbortController?.abort();
  component.currentAbortController = new AbortController();
  const { signal } = component.currentAbortController;
  const { searchString } = component;
  try {
    const searchType = await fetchSearchType(searchString, signal);
    component.suggestions = await fetchAddresses(
      searchString,
      searchType,
      signal
    );
    component.currentAbortController = null;
  } catch (error) {
    if (error.name !== "AbortError") console.debug(error);
  }
}, 500);

export default {
  name: "SAITSearchBar",
  components: {
    SearchBar,
  },
  data() {
    return {
      searchString: "",
      suggestions: [],
      currentAbortController: null,
    };
  },
  watch: {
    searchString() {
      getSuggestions(this);
    },
  },
  methods: {
    search() {
      console.log("searching...");
    },
  },
};
</script>

<style></style>
