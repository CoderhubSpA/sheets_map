import Vue from "vue";
import App from "./App.vue";
import SheetsMap from "./components/SheetsMap.vue";
import SheetsMapTools from "./components/SheetsMapTools.vue";


// Esta seccion es importante para poder desarrollar
// los componentes de manera aislada
if (import.meta.env.DEV){
    new Vue({
        render: h => h(App)
    }).$mount('#app');
}

export {
    SheetsMap,
    SheetsMapTools
};
