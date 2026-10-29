<template>
  <div>
    <!-- Circle drawing-->
    <l-circle-marker
      v-if="draft_circle_coordinates.length > 0"
      :lat-lng="draft_circle_coordinates"
      :radius="style_variables['polygon_draft_circle_radius']"
      :color="style_variables['polygon_draft_fill_color']"
      :fillColor="style_variables['polygon_draft_fill_color']"
      :fillOpacity="1"
      className="polygon_draft_circle_marker"
      title="Terminar poligono"
      v-on:click="draw()"
    />
    <!-- Circle drawing-->
    <div v-if="analytic_geojson_list.length > 0 && drawing">
      <div
        v-for="analytic_geojson in analytic_geojson_list"
        :key="analytic_geojson.id"
      >
        <l-geo-json
          :geojson="analytic_geojson.geojson"
          :options-style="active_layer_draft_style"
        ></l-geo-json>
      </div>
    </div>
    <!-- End Analytic layers -->

    <!-- Operative layers -->

    <div v-if="operative_geojson_list.length > 0 && drawing">
      <div
        v-for="operative_geojson in operative_geojson_list"
        :key="operative_geojson.id"
      >
        <l-geo-json
          :geojson="operative_geojson.geojson"
          :options-style="active_layer_draft_style"
        ></l-geo-json>
      </div>
    </div>
  </div>
</template>
<script>
import { LGeoJson, LCircleMarker } from "vue2-leaflet";
import * as L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
const DRAW_SHAPES = { polygon: "Polygon", circle: "Circle", rectangle: "Rectangle" };
export default {
  name: "PolygonDrafter",
  props: {
    info: Object,
    style_variables: Object,
    analytic_geojson_list: Array,
    operative_geojson_list: Array,
    map: Object,
  },
  components: {
    LGeoJson,
    LCircleMarker,
  },
  data() {
    return {
      drawing: false,
      polygon_arr: {},
      polygon_arr_id_cont: 0,
      layers: [],
      bounds_filters: [],
      draft_circle_coordinates: [],
      buttons_pressed: {
        marker: false,
        polyline: false,
        polygon: false,
        circle: false,
        rectangle: false,
        delete: false,
      },
      invisibleLayer: null,
      popupcontents: {},
      pmInitialized: false,
    };
  },
  computed: {
    //Estructura base para poligonos y cuadrados
    polygon_structure() {
      let polygon_structure = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { id: "" },
            geometry: {
              coordinates: [],
              type: "Polygon",
            },
          },
        ],
      };
      return polygon_structure;
    },
    draft_style() {
      const style = {
        // Geoman mantiene el dibujo continuo sin reentradas desde pm:drawend.
        continueDrawing: true,
        templineStyle: {
          color: this.style_variables["polygon_draft_color"],
          weight: this.style_variables["polygon_draft_weight"],
        },
        hintlineStyle: {
          color: this.style_variables["polygon_draft_color"],
          dashArray: this.style_variables["polygon_draft_dash_array"],
        },
        pathOptions: {
          color: this.style_variables["polygon_draft_color"],
          fillColor: this.style_variables["polygon_draft_fill_color"],
          fillOpacity: this.style_variables["polygon_draft_fill_opacity"],
        },
      };

      return style;
    },
    active_layer_draft_style() {
      const style = {
        opacity: 0,
        fillOpacity: 0,
      };

      return style;
    },
  },
  watch: {
    map() {
      this.initializePm();
    },
  },
  methods: {
    initializePm() {
      if (this.pmInitialized || !this.map || !this.map.pm || !L.PM) {
        return;
      }

      this.map.pm.setLang("es");
      L.PM.setOptIn(true);
      this.map.on("pm:create", this.handlePmCreate);
      this.pmInitialized = true;
    },
    handlePmCreate(e) {
      // Creamos el id, y tomamos la layer y el objeto geojson creado
      let polygon_id = "ID" + this.polygon_arr_id_cont;
      const layer = e.layer;
      let geojson =
        e.shape == "Circle"
          ? L.PM.Utils.circleToPolygon(layer, 60).toGeoJSON()
          : layer.toGeoJSON();

      // Agregamos el id al objeto geojson y a la layer, luego lo agregamos al array de poligonos
      layer.properties = polygon_id;
      geojson.properties.id = polygon_id;
      let polygon_structure = JSON.parse(
        JSON.stringify(this.polygon_structure),
      );
      polygon_structure["features"][0] = geojson;
      this.polygon_arr[polygon_id] = polygon_structure;
      this.polygon_arr_id_cont++;
      this.layers.push(layer);

      //Configuramos la layer como editable mediante geoman
      layer.options.pmIgnore = false;
      L.PM.reInitLayer(layer);

      // Agregamos los eventos para las modificaciones de la layer
      this.setupLayerEvents(layer);

      // Calculamos los bounds de los poligonos y los emitimos a sheets
      this.polygonBounds();
      this.$emit("apply-filter", this.bounds_filters);
      this.restorePopups();
    },
    restorePopups() {
      this.map.eachLayer((layer) => {
        if (this.popupcontents[layer._leaflet_id]) {
          layer.bindPopup(this.popupcontents[layer._leaflet_id]);
        }
      });
      this.popupcontents = {};
    },
    setupLayerEvents(layer) {
      // No esta activada la funcion para actualizar dibujos (edit tool), se mantiene en caso de ser agregado
      layer.on("pm:update", (e) => {
        let polygon_id = e.layer.properties;
        let geojson =
          e.shape == "Circle"
            ? L.PM.Utils.circleToPolygon(e.layer, 60).toGeoJSON()
            : e.layer.toGeoJSON();
        geojson.properties.id = polygon_id;
        let polygon_structure = JSON.parse(
          JSON.stringify(this.polygon_structure),
        );
        polygon_structure["features"][0] = geojson;
        this.polygon_arr[polygon_id] = polygon_structure;
        this.polygonBounds();
        this.$emit("apply-filter", this.bounds_filters);
      });
      // Evento para borrar poligonos
      layer.on("pm:remove", (e) => {
        // Se toma el id del poligono a partir de la layer, y se borra del arreglo. En caso de que el arreglo quede
        // vacio se lanza el evento para recalcular los puntos en vista del mapa
        let polygon_id = e.layer.properties;
        delete this.polygon_arr[polygon_id];
        if (Object.keys(this.polygon_arr).length == 0) {
          this.emitDrawnAreas();
          this.$emit("drawing-empty");
        } else {
          this.polygonBounds();
          this.$emit("apply-filter", this.bounds_filters);
        }
      });
    },
    polygonBounds() {
      this.emitDrawnAreas();
      let search = [];

      for (const geojson of Object.values(this.polygon_arr)) {
        search.push(geojson.features[0].geometry.coordinates[0]);
      }

      let all_col = this.info.columns;

      // Not continue if search is empty
      if (search.length == 0) {
        this.bounds_filters = [];
        return;
      }

      let bounds_filters = all_col
        .filter((columns) => columns.format == "POLYGON")
        .map((columns, key) => {
          let bounds_filter = {
            column: columns,
            id: "external-filter-" + columns.id,
            order: key + 1,
            search: search,
            type: "POLYGON",
          };
          return bounds_filter;
        });
      this.bounds_filters = bounds_filters;
    },
    emitDrawnAreas() {
      const areas = Object.values(this.polygon_arr)
        .flatMap(collection => collection.features.map(feature => feature.geometry));
      this.$emit("areas-changed", areas);
    },
    beginDraw(shape) {
      if (!this.map || !this.map.pm || !Object.prototype.hasOwnProperty.call(DRAW_SHAPES, shape)) return;
      this.cancelDraw();
      //Al iniciar un dibujo, desactivamos los popups de puntos y capas, de esta forma, podemos dibujar sin interferencia
      this.map.eachLayer((layer) => {
        layer.closePopup();
        this.popupcontents[layer._leaflet_id] = layer.getPopup();
        layer.unbindPopup();
      });
      this.drawing = true;
      this.buttons_pressed[shape] = true;
      this.setCursor("crosshair");
      this.map.pm.enableDraw(DRAW_SHAPES[shape], this.draft_style);
      this.$emit("button-pressed", { ...this.buttons_pressed });
    },
    toggleDelete() {
      if (!this.map || !this.map.pm) return;
      const enableRemoval = !this.buttons_pressed.delete;
      this.cancelDraw();
      if (enableRemoval) {
        this.map.pm.enableGlobalRemovalMode();
        this.buttons_pressed.delete = true;
        this.$emit("button-pressed", { ...this.buttons_pressed });
      }
    },
    cancelDraw() {
      this.drawing = false;
      Object.keys(this.buttons_pressed).forEach((button) => {
        this.buttons_pressed[button] = false;
      });
      if (this.map && this.map.pm) {
        this.map.pm.disableDraw();
        this.map.pm.disableGlobalRemovalMode();
        this.setCursor("");
        this.restorePopups();
      }
      this.$emit("button-pressed", { ...this.buttons_pressed });
    },
    setCursor(type) {
      const container = this.map.getContainer();
      if (container) container.style.cursor = type;
    },
    deleteAll() {
      for (const layer of this.layers) {
        this.map.removeLayer(layer);
      }
      this.layers = [];
      this.polygon_arr = {};
      this.bounds_filters = [];
      this.emitDrawnAreas();
      this.$emit("apply-filter", null);
    },
  },
};
</script>
