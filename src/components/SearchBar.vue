<template>
  <div class="search-bar">
    <b-input-group>
      <b-form-input
        class="search-input"
        type="text"
        placeholder="Buscar"
        title="Buscar una dirección, comuna o zona"
      />
      <b-input-group-append>
        <b-button class="search-btn" title="Buscar">
          <b-icon icon="search" />
        </b-button>
      </b-input-group-append>
    </b-input-group>

    <ul v-show="suggestions.length > 0">
      <li v-for="suggestion in suggestions" :key="suggestion">
        {{ suggestion }}
      </li>
    </ul>
  </div>
</template>
<script>
import { BIcon, BButton, BFormInput, BInputGroupAppend } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default {
  name: "SearchBar",
  components: {
    BIcon,
    BButton,
    BFormInput,
    BInputGroupAppend,
  },
  data() {
    return {
      suggestions: [],
    };
  },
};
</script>
<style scoped lang="scss">
.search-bar {
  --focus-shadow-color: rgb(130 138 145 / 50%);
  --text-color: #d3d3d3;
  --border-radius: 8px;
  --background-color: #001d09;
  width: Min(100%, 270px);

  .search-input,
  .search-btn {
    padding: var(--border-radius);
    height: 36px;
    background-color: var(--background-color);
    border: none;
    color: var(--text-color);
  }

  :is(.search-input, .search-btn):is(:focus:active, :focus) {
    box-shadow: 0 0 0 0.2rem var(--focus-shadow-color);
  }

  .search-input {
    border-radius: var(--border-radius) 0 0 var(--border-radius);
  }

  .search-input::placeholder {
    color: var(--text-color);
  }

  .search-btn {
    font-size: 100%;
    border-radius: 0 var(--border-radius) var(--border-radius) 0;
  }
}
</style>
