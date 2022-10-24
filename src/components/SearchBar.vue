<template>
  <div class="search-bar" :class="{ 'show-suggestions': showSuggestions }">
    <b-input-group>
      <!-- Usamos prevent con keydown.down y up para que el cursor (|) no
     se mueva del final al inicio al cambiar de sugerencia. -->
      <input
        class="search-input form-control"
        type="text"
        placeholder="Buscar"
        title="Buscar una dirección, comuna o zona"
        @input="handleInput"
        :value="value"
        @keydown.enter="search"
        @keydown.down.prevent="moveToSuggestion('down')"
        @keydown.up.prevent="moveToSuggestion('up')"
      />
      <b-input-group-append>
        <b-button
          title="Borrar búsqueda"
          class="remove-btn"
          type="button"
          @click="input('')"
        >
          <b-icon icon="x" />
        </b-button>
        <b-button
          class="search-btn"
          title="Buscar"
          @click="search"
          type="button"
        >
          <b-icon icon="search" />
        </b-button>
      </b-input-group-append>
    </b-input-group>

    <ul class="suggestions" v-show="showSuggestions">
      <li
        v-for="(suggestion, index) in suggestions"
        :key="getSuggestionId(suggestion)"
        @click="$emit('search', index)"
        :class="{ selected: index === selectedSuggestionIndex }"
      >
        {{ getSuggestionDisplayValue(suggestion) }}
      </li>
    </ul>
  </div>
</template>

<script>
import { BIcon, BButton, BInputGroupAppend, BInputGroup } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

/**
 * Una barra de búsqueda que permite mostrar sugerencias.
 * @example
 * ```html
 * <search-bar
 *  v-model="searchValue"
 *  :suggestions="['Una sugerencia', 'Otra Sugerencia']"
 *  :getSuggestionId="suggestion => suggestion"
 *  :getSuggestionDisplayValue="suggestion => suggestion"
 *  v-on:search="selectedSuggestionIndex => doSomething(selectedSuggestionIndex)"
 * />
 * ```
 */
export default {
  name: "SearchBar",
  components: {
    BIcon,
    BButton,
    BInputGroupAppend,
    BInputGroup,
  },
  props: {
    value: String,
    suggestions: Array,
    /** Permite asignar :key a cada elemento de la lista. */
    getSuggestionId: Function,
    /** Permite obtener el valor "humano" para mostrar en cada elemento. */
    getSuggestionDisplayValue: Function,
  },
  data() {
    return {
      selectedSuggestionIndex: 0,
    };
  },
  computed: {
    showSuggestions() {
      return this.suggestions.length > 0;
    },
  },
  methods: {
    moveToSuggestion(direction) {
      const suggestionsLength = this.suggestions.length;
      if (suggestionsLength === 0) return;

      if (direction === "down") this.selectedSuggestionIndex++;
      else if (direction === "up") this.selectedSuggestionIndex--;
      else this.selectedSuggestionIndex++;

      if (this.selectedSuggestionIndex >= suggestionsLength)
        this.selectedSuggestionIndex = suggestionsLength - 1;
      if (this.selectedSuggestionIndex < 0) this.selectedSuggestionIndex = 0;
    },
    handleInput(event) {
      this.input(event.target.value);
    },
    input(value) {
      this.selectedSuggestionIndex = 0;
      this.$emit("input", value);
    },
    search() {
      this.$emit("search", this.selectedSuggestionIndex);
    },
  },
};
</script>
<style scoped lang="scss">
.search-bar {
  --focus-shadow-color: rgb(130 138 145 / 50%);
  --text-color: #d3d3d3;
  --border-radius: 8px;
  --background-color: #001d09;
  --selected-background-color: rgb(65 84 77);
  background-color: var(--background-color);
  border-radius: var(--border-radius);
  width: Min(100%, 270px);
  position: relative;
}

.search-input,
.search-btn,
.remove-btn {
  padding: var(--border-radius);
  height: 36px;
  background-color: var(--background-color);
  border: none;
  color: var(--text-color);
}

:is(.search-input, .search-btn, .remove-btn):is(:focus:active, :focus) {
  box-shadow: 0 0 0 0.2rem var(--focus-shadow-color);
}

.search-input {
  border-radius: var(--border-radius) 0 0 var(--border-radius);
}

.search-input::placeholder {
  color: var(--text-color);
}

.search-btn,
.remove-btn {
  font-size: 100%;
}

.search-btn {
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
}

.suggestions {
  position: absolute;
  top: 100%;
  width: 100%;
  background-color: var(--background-color);
  color: var(--text-color);
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  list-style: none;
  font-size: 1rem;
  text-align: left;
  padding: 0;
  margin: 0;
  display: none;

  > li {
    padding: 8px;
    cursor: pointer;
  }

  > li.selected,
  li:hover {
    background-color: var(--selected-background-color);
  }

  > li:last-child {
    border-radius: 0 0 var(--border-radius) var(--border-radius);
  }
}

// Separamos estas dos reglas, pues algunos navegadores
// aún no soportan :has().
.search-bar:focus-within.show-suggestions {
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}
.search-bar:has(.suggestions:hover) {
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.search-bar:focus-within.show-suggestions .suggestions,
.suggestions:hover {
  display: block;
}
</style>
