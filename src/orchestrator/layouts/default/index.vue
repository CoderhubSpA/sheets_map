<template>
    <div class="default-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <div v-if="$slots['zone-a']" class="zone-a">
            <h1>Zone A</h1>
            <slot name="zone-a"></slot>
        </div>
        <div class="zones-container">
            <div v-if="$slots['zone-b']" class="zone-b">
                <h2>Zone B</h2>
                <slot name="zone-b">
                </slot>
            </div>
            <div v-if="$slots['zone-c']" class="zone-c">
                <h4>Zone C</h4>
                <slot name="zone-c"></slot>
            </div>
            <div v-if="$slots['zone-d']" class="zone-d">
                <h4>Zone D</h4>
                <slot name="zone-d"></slot>
            </div>
            <div v-if="$slots['zone-e']" class="zone-e">
                <h4>Zone E</h4>
                <slot name="zone-e"></slot>
            </div>
            <div v-if="$slots['zone-f']" class="zone-f">
                <h4>Zone F</h4>
                <slot name="zone-f"></slot>
            </div>
            <div v-if="$slots['zone-g']" class="zone-g">
                <h4>Zone G</h4>
                <slot name="zone-g"></slot>
            </div>
            <div v-if="$slots['zone-h']" class="zone-h">
                <h4>Zone H</h4>
                <slot name="zone-h"></slot>
            </div>
        </div>
        <div v-if="$slots['zone-i']" class="zone-i">
            <h2>Zone I</h2>
            <slot name="zone-i"></slot>
        </div>
    </div>
</template>
<script>
import Sidebar from '../../components/Sidebar.vue';


export default {
    props: {
        sidebarCollapsed: {
            type: Boolean,
            default: false,
        }
    },
    components: {
        Sidebar,
    }
};
</script>
<style lang="scss">
@use "../../sass/layouts/default";

.zone-a h1,
.zone-b > h2,
.zone-c > h4,
.zone-d > h4,
.zone-e > h4,
.zone-f > h4,
.zone-g > h4,
.zone-h > h4,
.zone-i > h2 {
    display: none;
}
</style>
