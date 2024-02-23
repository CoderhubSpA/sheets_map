import Vue from "vue";
import App from "./App.vue";


import SheetsMap from "./components/SheetsMap.vue";
import SheetsMapTools from "./components/SheetsMapTools.vue";
import DrawTools from "./components/DrawTools.vue";

// Esta seccion es importante para poder desarrollar
// los componentes de manera aislada
if (process.env.NODE_ENV == 'development'){
    new Vue({
        render: h => h(App)
    }).$mount('#app');
}


export {
    SheetsMap,
    SheetsMapTools,
    DrawTools
};