import App from "./App.vue";
import Vue from "vue";
import BootstrapVue from 'bootstrap-vue/dist/bootstrap-vue.esm';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'bootstrap/dist/css/bootstrap.css';

Vue.use(BootstrapVue);


import SheetsMap from "./components/SheetsMap.vue";
import SheetsMapTools from "./components/SheetsMapTools.vue";

const SheetsMapOut = {
    install(Vue) {
        // Let's register our component globally
        // https://vuejs.org/v2/guide/components-registration.html
        Vue.component("sheets_map", SheetsMap);
        Vue.component("sheets_map_tools", SheetsMapTools);
    }
};

// Automatic installation if Vue has been added to the global scope.
if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(SheetsMapOut);
}

if (process.env.NODE_ENV == 'development'){
    new Vue({
        render: h => h(App)
    }).$mount('#app')

}



export default SheetsMapOut;