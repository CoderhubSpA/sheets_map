"use strict";
((typeof self !== 'undefined' ? self : this)["webpackChunkindex"] = (typeof self !== 'undefined' ? self : this)["webpackChunkindex"] || []).push([[894,604],{

/***/ 8894:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": function() { return /* binding */ SAITSearchBar; }
});

;// CONCATENATED MODULE: ./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/index.js??vue-loader-options!./src/components/SAITSearchBar.vue?vue&type=template&id=6565424b&
var render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('search-bar',{attrs:{"suggestions":_vm.suggestions,"getSuggestionDisplayValue":function (address) { return address['DireccionOrPOI']; },"getSuggestionId":function (address) { return address['ID']; }},on:{"search":_vm.changeLocation},model:{value:(_vm.searchString),callback:function ($$v) {_vm.searchString=$$v},expression:"searchString"}})}
var staticRenderFns = []


// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js
var asyncToGenerator = __webpack_require__(5675);
// EXTERNAL MODULE: ./node_modules/regenerator-runtime/runtime.js
var runtime = __webpack_require__(6642);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.object.to-string.js
var es_object_to_string = __webpack_require__(1539);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.trim.js
var es_string_trim = __webpack_require__(3210);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.promise.js
var es_promise = __webpack_require__(8674);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.concat.js
var es_array_concat = __webpack_require__(2222);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.map.js
var es_array_map = __webpack_require__(1249);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.from.js
var es_array_from = __webpack_require__(1038);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.iterator.js
var es_string_iterator = __webpack_require__(8783);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.function.name.js
var es_function_name = __webpack_require__(8309);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.regexp.exec.js
var es_regexp_exec = __webpack_require__(4916);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.replace.js
var es_string_replace = __webpack_require__(5306);
// EXTERNAL MODULE: ./src/components/SearchBar.vue + 5 modules
var SearchBar = __webpack_require__(3604);
// EXTERNAL MODULE: ./node_modules/lodash/lodash.js
var lodash = __webpack_require__(9916);
var lodash_default = /*#__PURE__*/__webpack_require__.n(lodash);
;// CONCATENATED MODULE: ./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib/index.js??clonedRuleSet-80.use[1]!./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/index.js??vue-loader-options!./src/components/SAITSearchBar.vue?vue&type=script&lang=js&












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



var getAddressFromNode = function getAddressFromNode(xmlAddressNode) {
  var tags = ["ID", "DireccionOrPOI", "Latitud", "Longitud"];
  return tags.reduce(function (address, tag) {
    address[tag] = xmlAddressNode.querySelector(tag).textContent.trim();
    return address;
  }, {});
};

var fetchSearchType = /*#__PURE__*/function () {
  var _ref = (0,asyncToGenerator/* default */.Z)( /*#__PURE__*/regeneratorRuntime.mark(function _callee(searchString, searchUrl, abortSignal) {
    var headers, body, requestOptions, response, parser, xml;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            headers = new Headers();
            headers.append("Content-Type", "text/xml");
            body = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<soap:Envelope\n  xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n  xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"\n  xmlns:soap=\"https://schemas.xmlsoap.org/soap/envelope/\">\n  <soap:Body>\n      <GetTipo xmlns=\"http://tempuri.org/\">\n          <busqueda>".concat(searchString, "</busqueda>\n      </GetTipo>\n  </soap:Body>\n</soap:Envelope>");
            requestOptions = {
              method: "POST",
              headers: headers,
              body: body,
              redirect: "follow",
              signal: abortSignal
            };
            _context.next = 6;
            return fetch(searchUrl, requestOptions);

          case 6:
            response = _context.sent;
            parser = new DOMParser();
            _context.t0 = parser;
            _context.next = 11;
            return response.text();

          case 11:
            _context.t1 = _context.sent;
            xml = _context.t0.parseFromString.call(_context.t0, _context.t1, "text/xml");
            return _context.abrupt("return", xml.querySelector("GetTipoResult").textContent.trim());

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function fetchSearchType(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var fetchAddresses = /*#__PURE__*/function () {
  var _ref2 = (0,asyncToGenerator/* default */.Z)( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(searchString, searchType, searchUrl, searchCountry, maxResults, abortSignal) {
    var headers, body, requestOptions, response, parser, xml;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            headers = new Headers();
            headers.append("Content-Type", "text/xml");
            body = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<soap:Envelope\n  xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n  xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"\n  xmlns:soap=\"https://schemas.xmlsoap.org/soap/envelope/\">\n  <soap:Body>\n    <FindDireccionesTextLibre xmlns=\"http://tempuri.org/\">\n        <busqueda>".concat(searchString, "</busqueda>\n        <tipo>").concat(searchType, "</tipo>\n        <pais>").concat(searchCountry, "</pais>\n        <canResultados>").concat(maxResults, "</canResultados>\n    </FindDireccionesTextLibre>\n  </soap:Body>\n</soap:Envelope>");
            requestOptions = {
              method: "POST",
              headers: headers,
              body: body,
              redirect: "follow",
              signal: abortSignal
            };
            _context2.next = 6;
            return fetch(searchUrl, requestOptions);

          case 6:
            response = _context2.sent;
            parser = new DOMParser();
            _context2.t0 = parser;
            _context2.next = 11;
            return response.text();

          case 11:
            _context2.t1 = _context2.sent;
            xml = _context2.t0.parseFromString.call(_context2.t0, _context2.t1, "text/xml");
            return _context2.abrupt("return", Array.from(xml.querySelectorAll("DireccionTextLibre")).map(getAddressFromNode));

          case 14:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function fetchAddresses(_x4, _x5, _x6, _x7, _x8, _x9) {
    return _ref2.apply(this, arguments);
  };
}();

/* harmony default export */ var SAITSearchBarvue_type_script_lang_js_ = ({
  name: "SAITSearchBar",
  components: {
    SearchBar: SearchBar["default"]
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
    config: Object
  },
  data: function data() {
    return {
      searchString: "",
      suggestions: [],
      currentAbortController: null
    };
  },
  watch: {
    searchString: function searchString(newValue) {
      if (newValue === "") {
        this.suggestions = [];
        return;
      }

      this.getSuggestions(this);
    }
  },
  methods: {
    getSuggestions: lodash_default().throttle( /*#__PURE__*/(0,asyncToGenerator/* default */.Z)( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
      var _this$currentAbortCon;

      var signal, searchString, _this$config, search_type_url, search_addresses_url, search_country, search_max_results, searchType;

      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              (_this$currentAbortCon = this.currentAbortController) === null || _this$currentAbortCon === void 0 ? void 0 : _this$currentAbortCon.abort();
              this.currentAbortController = new AbortController();
              signal = this.currentAbortController.signal;
              searchString = this.searchString;
              _this$config = this.config, search_type_url = _this$config.search_type_url, search_addresses_url = _this$config.search_addresses_url, search_country = _this$config.search_country, search_max_results = _this$config.search_max_results;
              _context3.prev = 5;
              _context3.next = 8;
              return fetchSearchType(searchString, search_type_url, signal);

            case 8:
              searchType = _context3.sent;
              _context3.next = 11;
              return fetchAddresses(searchString, searchType, search_addresses_url, search_country, search_max_results, signal);

            case 11:
              this.suggestions = _context3.sent;
              this.currentAbortController = null;
              _context3.next = 18;
              break;

            case 15:
              _context3.prev = 15;
              _context3.t0 = _context3["catch"](5);
              if (_context3.t0.name !== "AbortError") console.debug(_context3.t0);

            case 18:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this, [[5, 15]]);
    })), 500),
    changeLocation: function changeLocation(selectedSuggestionIndex) {
      if (this.suggestions.length === 0) return;
      var suggestion = this.suggestions[selectedSuggestionIndex];
      var Latitud = suggestion.Latitud,
          Longitud = suggestion.Longitud,
          DireccionOrPOI = suggestion.DireccionOrPOI;
      this.searchString = DireccionOrPOI;

      var parse = function parse(string) {
        return parseFloat(string.replace(",", "."));
      };

      var latLng = [parse(Latitud), parse(Longitud)];
      this.$emit("change-location", latLng);
    }
  }
});
;// CONCATENATED MODULE: ./src/components/SAITSearchBar.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_SAITSearchBarvue_type_script_lang_js_ = (SAITSearchBarvue_type_script_lang_js_); 
// EXTERNAL MODULE: ./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/runtime/componentNormalizer.js
var componentNormalizer = __webpack_require__(3736);
;// CONCATENATED MODULE: ./src/components/SAITSearchBar.vue





/* normalize component */
;
var component = (0,componentNormalizer/* default */.Z)(
  components_SAITSearchBarvue_type_script_lang_js_,
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ var SAITSearchBar = (component.exports);

/***/ }),

/***/ 3604:
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
var icon = __webpack_require__(7356);
// EXTERNAL MODULE: ./node_modules/bootstrap-vue/esm/components/button/button.js + 8 modules
var button_button = __webpack_require__(608);
// EXTERNAL MODULE: ./node_modules/bootstrap-vue/esm/components/form-input/form-input.js + 9 modules
var form_input = __webpack_require__(4399);
// EXTERNAL MODULE: ./node_modules/bootstrap-vue/esm/components/input-group/input-group-append.js + 2 modules
var input_group_append = __webpack_require__(303);
// EXTERNAL MODULE: ./node_modules/bootstrap-vue/dist/bootstrap-vue.css
var bootstrap_vue = __webpack_require__(3417);
;// CONCATENATED MODULE: ./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib/index.js??clonedRuleSet-80.use[1]!./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/index.js??vue-loader-options!./src/components/SearchBar.vue?vue&type=script&lang=js&
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
;// CONCATENATED MODULE: ./node_modules/mini-css-extract-plugin/dist/loader.js??clonedRuleSet-62.use[0]!./node_modules/css-loader/dist/cjs.js??clonedRuleSet-62.use[1]!./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/loaders/stylePostLoader.js!./node_modules/postcss-loader/dist/cjs.js??clonedRuleSet-62.use[2]!./node_modules/sass-loader/dist/cjs.js??clonedRuleSet-62.use[3]!./node_modules/@vue/cli-service/node_modules/@vue/vue-loader-v15/lib/index.js??vue-loader-options!./src/components/SearchBar.vue?vue&type=style&index=0&id=3408c470&prod&scoped=true&lang=scss&
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
//# sourceMappingURL=index.umd.894.js.map