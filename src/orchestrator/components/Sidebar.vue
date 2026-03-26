<template>
    <div class="sidebar" :class="{ collapsed: collapsed }">
        <div class="sidebar-toggle">
            <button @click="collapsed = !collapsed" :title="collapsed ? 'Expandir' : 'Contraer'">
                <b-icon icon="list"></b-icon>
            </button>
            <h3>Menú</h3>
        </div>
        <div class="body" v-show="!collapsed">
            <slot name="body"></slot>
        </div>
    </div>
</template>
<script>
import BubbleButton from './Button.vue';
import BubbleRadio from './Radio.vue';
import BubbleSection from './Section.vue';
import MultiRange from './MultiRange.vue';
import Range from './Range.vue';
import AppImage from './Image.vue';
import ProfileModal from './ProfileModal.vue';
import greenAtlasLogo from '../../assets/green-atlas-logo.svg';


export default {
    components: {
        BubbleSection,
        BubbleButton,
        Range,
        MultiRange,
        BubbleRadio,
        AppImage,
        ProfileModal,
    },
    data() {
        return {
            greenAtlasLogo,
            collapsed: false,
            showProfileModal: false,
            userName: 'Matías Delpiano',
            optimalRange: null,
            rangeOptions: [
                { value: "variado", label: "Variado", color: "linear-gradient(to right, #FF0000, #008000, #800080)" },
                { value: "rojo", label: "Rojo", color: "#ff0000" },
                { value: "azul", label: "Azul", color: "#0000ff" },
                { value: "verde", label: "Verde", color: "#00ff00" }
            ],
            mapa: "Zonificado"
        };
    },
}
</script>
<style lang="scss" scoped>
.sidebar {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: calc(100dvh - 30px);
    padding: 15px;
    border-radius: 20px;
    background-color: var(--gray-scale-1);

    h3 {
        text-align: center;
        margin: 0 0 0 12px;
        color: var(--gray-scale-7);
        font-size: var(--font-xl-size);
        font-weight: 600;
    }

    &.collapsed {
        width: 70px;
        height: 70px;

        h3 {
            display: none;
        }

        overflow: hidden;
    }

    .divider {
        margin: 10px 0 20px 0;
        border: none;
        border-top: solid 2px var(--gray-scale-3);
    }

    .sidebar-toggle {
        display: flex;
        justify-content: left;
        align-items: center;
        margin-bottom: 20px;

        button {
            background-color: transparent;
            padding: 2px 8px;
            color: var(--secondary-color);
            border-radius: 50px;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;

            &:hover {
                background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
            }
        }
    }

    .body {
        flex: 1;
        overflow-y: auto;
    }
}
</style>
