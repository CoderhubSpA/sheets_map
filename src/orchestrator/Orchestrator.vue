<template>
    <div class="orchestrator" :class="themeClass">
        <component :is="LayoutComponent" :sidebar-collapsed="sidebarCollapsed">
            <template v-for="zoneKey in zoneKeys" v-slot:[zoneKey]>
                <component
                    :is="getComponent(zones[zoneKey].component)"
                    v-bind="mergedProps(zoneKey)"
                    @sidebar-collapsed="zoneKey === 'zone-b' && onSidebarCollapsed($event)"
                />
            </template>
        </component>
    </div>
</template>
<script>
import DefaultLayout from "./layouts/default/index.vue";

export default {
    data() {
        return {
            sidebarCollapsed: false,
        }
    },
    props: {
        layout: {
            type: String,
            default: 'default',
        },
        zones: {
            type: Object,
            required: true
        },
        theme: {
            type: String,
            default: 'sheets',
        },
    },
    components: {
        DefaultLayout
    },
    computed: {
        LayoutComponent() {
            return this.layout === 'default' ? DefaultLayout : null;
        },
        /**
         * Keys of zones that have a component defined.
         */
        zoneKeys() {
            return Object.keys(this.zones).filter(k => this.zones[k] && this.zones[k].component);
        },
        /**
         * CSS class derived from the `theme` prop, applied to the root element
         * so that descendant components can consume theme CSS custom properties.
         */
        themeClass() {
            return this.theme ? `theme-${this.theme}` : null;
        },
        /**
         * Global props derived from Orchestrator's own props.
         * These are injected into every zone component unless overridden
         * by zone-level props.
         */
    },
    methods: {
        onSidebarCollapsed(isCollapsed) {
            this.sidebarCollapsed = isCollapsed
        },
        /**
         * Merges globalProps with zone-specific props.
         * Zone-level props take priority over global ones.
         */
        mergedProps(zoneKey) {
            return Object.assign({}, this.globalProps, this.zones[zoneKey].props || {});
        },
        /**
         * Returns the component definition from the zone.
         * It can be a component object (imported) or a globally
         * registered component name string.
         */
        getComponent(component) {
            return component || null;
        }
    }
}
</script>
<style lang="scss">
@use './sass/themes/sheets.scss';
@use './sass/themes/fruit.scss';
</style>
