"use strict";
((typeof self !== 'undefined' ? self : this)["webpackChunk_paupololi_sheets_map"] = (typeof self !== 'undefined' ? self : this)["webpackChunk_paupololi_sheets_map"] || []).push([[123],{

/***/ 8123:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": function() { return /* binding */ SearchBar; }
});

;// CONCATENATED MODULE: ./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/index.js??vue-loader-options!./src/components/SearchBar.vue?vue&type=template&id=3408c470&scoped=true&
var render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"search-bar",class:{ 'show-suggestions': _vm.showSuggestions }},[_c('b-input-group',[_c('b-form-input',{staticClass:"search-input",attrs:{"type":"text","placeholder":"Buscar","title":"Buscar una dirección, comuna o zona","value":_vm.value},on:{"input":_vm.input,"keydown":[function($event){if(!$event.type.indexOf('key')&&_vm._k($event.keyCode,"enter",13,$event.key,"Enter")){ return null; }return _vm.search.apply(null, arguments)},function($event){if(!$event.type.indexOf('key')&&_vm._k($event.keyCode,"down",40,$event.key,["Down","ArrowDown"])){ return null; }$event.preventDefault();return _vm.moveToSuggestion('down')},function($event){if(!$event.type.indexOf('key')&&_vm._k($event.keyCode,"up",38,$event.key,["Up","ArrowUp"])){ return null; }$event.preventDefault();return _vm.moveToSuggestion('up')}]}}),_c('b-input-group-append',[_c('b-button',{staticClass:"remove-btn",attrs:{"title":"Borrar búsqueda","type":"button"},on:{"click":function($event){return _vm.input('')}}},[_c('b-icon',{attrs:{"icon":"x"}})],1),_c('b-button',{staticClass:"search-btn",attrs:{"title":"Buscar","type":"button"},on:{"click":_vm.search}},[_c('b-icon',{attrs:{"icon":"search"}})],1)],1)],1),_c('ul',{directives:[{name:"show",rawName:"v-show",value:(_vm.showSuggestions),expression:"showSuggestions"}],staticClass:"suggestions"},_vm._l((_vm.suggestions),function(suggestion,index){return _c('li',{key:_vm.getSuggestionId(suggestion),class:{ selected: index === _vm.selectedSuggestionIndex },on:{"click":function($event){return _vm.$emit('search', index)}}},[_vm._v(" "+_vm._s(_vm.getSuggestionDisplayValue(suggestion))+" ")])}),0)],1)}
var staticRenderFns = []


// EXTERNAL MODULE: ./node_modules/bootstrap-vue/esm/icons/icon.js + 3 modules
var icon = __webpack_require__(6712);
// EXTERNAL MODULE: ./node_modules/bootstrap-vue/esm/components/button/button.js + 8 modules
var button_button = __webpack_require__(7324);
// EXTERNAL MODULE: ./node_modules/bootstrap-vue/esm/components/form-input/form-input.js + 9 modules
var form_input = __webpack_require__(9574);
// EXTERNAL MODULE: ./node_modules/bootstrap-vue/esm/components/input-group/input-group-append.js + 2 modules
var input_group_append = __webpack_require__(7110);
// EXTERNAL MODULE: ./node_modules/bootstrap-vue/dist/bootstrap-vue.css
var bootstrap_vue = __webpack_require__(7024);
;// CONCATENATED MODULE: ./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib/index.js??clonedRuleSet-40.use[1]!./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/index.js??vue-loader-options!./src/components/SearchBar.vue?vue&type=script&lang=js&
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//



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

/* harmony default export */ var SearchBarvue_type_script_lang_js_ = ({
  name: "SearchBar",
  components: {
    BIcon: icon/* BIcon */.H,
    BButton: button_button/* BButton */.T,
    BFormInput: form_input/* BFormInput */.e,
    BInputGroupAppend: input_group_append/* BInputGroupAppend */.B
  },
  props: {
    value: String,
    suggestions: Array,

    /** Permite asignar :key a cada elemento de la lista. */
    getSuggestionId: Function,

    /** Permite obtener el valor "humano" para mostrar en cada elemento. */
    getSuggestionDisplayValue: Function
  },
  data: function data() {
    return {
      selectedSuggestionIndex: 0
    };
  },
  computed: {
    showSuggestions: function showSuggestions() {
      return this.suggestions.length > 0;
    }
  },
  methods: {
    moveToSuggestion: function moveToSuggestion(direction) {
      var suggestionsLength = this.suggestions.length;
      if (suggestionsLength === 0) return;
      if (direction === "down") this.selectedSuggestionIndex++;else if (direction === "up") this.selectedSuggestionIndex--;else this.selectedSuggestionIndex++;
      if (this.selectedSuggestionIndex >= suggestionsLength) this.selectedSuggestionIndex = suggestionsLength - 1;
      if (this.selectedSuggestionIndex < 0) this.selectedSuggestionIndex = 0;
    },
    input: function input(value) {
      this.selectedSuggestionIndex = 0;
      this.$emit("input", value);
    },
    search: function search() {
      this.$emit("search", this.selectedSuggestionIndex);
    }
  }
});
;// CONCATENATED MODULE: ./src/components/SearchBar.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_SearchBarvue_type_script_lang_js_ = (SearchBarvue_type_script_lang_js_); 
;// CONCATENATED MODULE: ./node_modules/mini-css-extract-plugin/dist/loader.js??clonedRuleSet-22.use[0]!./node_modules/css-loader/dist/cjs.js??clonedRuleSet-22.use[1]!./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/loaders/stylePostLoader.js!./node_modules/postcss-loader/dist/cjs.js??clonedRuleSet-22.use[2]!./node_modules/sass-loader/dist/cjs.js??clonedRuleSet-22.use[3]!./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/index.js??vue-loader-options!./src/components/SearchBar.vue?vue&type=style&index=0&id=3408c470&prod&scoped=true&lang=scss&
// extracted by mini-css-extract-plugin

;// CONCATENATED MODULE: ./src/components/SearchBar.vue?vue&type=style&index=0&id=3408c470&prod&scoped=true&lang=scss&

// EXTERNAL MODULE: ./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/runtime/componentNormalizer.js
var componentNormalizer = __webpack_require__(3736);
;// CONCATENATED MODULE: ./src/components/SearchBar.vue



;


/* normalize component */

var component = (0,componentNormalizer/* default */.Z)(
  components_SearchBarvue_type_script_lang_js_,
  render,
  staticRenderFns,
  false,
  null,
  "3408c470",
  null
  
)

/* harmony default export */ var SearchBar = (component.exports);

/***/ })

}]);
//# sourceMappingURL=index.common.123.js.map