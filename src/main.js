import App from "./App.vue";
import Vue from "vue";

import SheetsMap from "./components/SheetsMap.vue";

const SheetsMapOut = {
    install(Vue) {
        // Let's register our component globally
        // https://vuejs.org/v2/guide/components-registration.html
        Vue.component("sheets_map", SheetsMap);
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