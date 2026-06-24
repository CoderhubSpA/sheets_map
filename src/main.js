import Vue from "vue";
import App from "./App.vue";
import SheetsMap from "./components/SheetsMap.vue";
import SheetsMapTools from "./components/SheetsMapTools.vue";

// Fix: Vue 2.7 made $listeners readonly (backporting Vue 3 behavior where
// listeners are merged into $attrs). BootstrapVue 2.x internally tries to
// assign to $listeners in components like BModal, triggering a spurious
// "[Vue warn]: $listeners is readonly" warning. Patch both Vue's warnHandler
// and console.error to guarantee the message never reaches the browser console.
Vue.config.warnHandler = (msg, vm, trace) => {
    if (msg && msg.includes('$listeners is readonly')) return;
    console.error('[Vue warn]: ' + msg + (trace || ''));
};
const _consoleError = console.error;
console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('$listeners is readonly')) return;
    _consoleError(...args);
};

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
