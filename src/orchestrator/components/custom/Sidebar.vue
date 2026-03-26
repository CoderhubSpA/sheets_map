<template>
    <div class="sidebar" :class="{ collapsed: collapsed }">
        <div class="sidebar-toggle">
            <button @click="toggleSidebar" :title="collapsed ? 'Expandir' : 'Contraer'">
                <b-icon icon="list"></b-icon>
            </button>
            <h3>Menú</h3>
        </div>
        <div class="header" v-show="!collapsed">
            <Section icon="map" name="Mapa"></Section>
            <hr class="divider">
        </div>
        <div class="body" v-show="!collapsed">
            <h3>Mapa</h3>
            <div class="buttons-container">
                <Button name="Zonificado" :active="mapa === 'Zonificado'" value="Zonificado" @update:modelValue="mapa = $event" @click="showLoading = true"></Button>
                <Button name="Detalle" :active="mapa === 'Detalle'" value="Detalle" @update:modelValue="mapa = $event"></Button>
            </div>
            <div v-if="mapa == 'Zonificado'" class="range-container">
                <Range></Range>
            </div>
            <div class="radio-container">
                <Radio :options="rangeOptions" :modelValue="optimalRange"
                    @update:modelValue="optimalRange = $event"></Radio>
            </div>
            <div v-if="mapa == 'Zonificado'" class="multi-range-container">
                 <h3>Rango óptimo</h3>
                <MultiRange></MultiRange>
            </div>
            <div class="image-container">
                <AppImage :src="greenAtlasLogo" alt="Green Atlas Logo" :width="'40%'"></AppImage>
            </div>
            <div class="text-container">
                <p>Leaflet &copy; OpenStreetMap <br>contributors</p>
            </div>
            <hr class="divider">
            <div class="profile-container" @click.prevent="showProfileModal = true">
                 <Section icon="person" name="Mi perfil"></Section>
            </div>
        </div>

        <div class="signup-container">
            <Section icon="x-circle-fill" name="Desconectar" redirect="#" color="#ed666f" @click="showConfirmDisconnect = true"></Section>
        </div>

        <!-- Profile Modal -->
        <modal v-model="showProfileModal">
            <profile
                :user-name="userName"
                @change-password="handleChangePassword"
                @disconnect="handleDisconnect"
                @close="showProfileModal = false"
            ></profile>
        </modal>

        <!-- Confirm Disconnect Modal -->
        <modal v-model="showConfirmDisconnect">
            <confirm
                message="¿Seguro deseas salir?"
                @accept="doDisconnect"
                @cancel="showConfirmDisconnect = false"
            ></confirm>
        </modal>

        <Loading v-model="showLoading" :message="'Cargando...'"></Loading>
    </div>
</template>
<script>
import Button from '../Button.vue';
import Radio from '../Radio.vue';
import Section from '../Section.vue';
import MultiRange from '../MultiRange.vue';
import Range from '../Range.vue';
import AppImage from '../Image.vue';
import Modal from '../Modal.vue';
import Profile from '../Profile.vue';
import Confirm from '../Confirm.vue';
import Loading from '../Loading.vue';
import greenAtlasLogo from '../../../assets/green-atlas-logo.svg';


export default {
    components: {
        Section,
        Button,
        Range,
        MultiRange,
        Radio,
        AppImage,
        Modal,
        Profile,
        Confirm,
        Loading
    },
    data() {
        return {
            greenAtlasLogo,
            collapsed: false,
            showProfileModal: false,
            showConfirmDisconnect: false,
            showLoading: true,
            userName: 'Matías Delpiano',
            optimalRange: null,
            rangeOptions: [
                { value: "variado", label: "Variado", color: "linear-gradient(90deg,rgba(255, 0, 8, 1) 0%, rgba(87, 199, 133, 1) 50%, rgba(188, 83, 237, 1) 100%)" },
                { value: "rojo", label: "Rojo", color: "#ff0000" },
                { value: "azul", label: "Azul", color: "#0000ff" },
                { value: "verde", label: "Verde", color: "#00ff00" }
            ],
            mapa: "Zonificado"
        };
    },
    methods: {
        toggleSidebar() {
            this.collapsed = !this.collapsed
            this.$emit('sidebar-collapsed', this.collapsed)
        },
        handleChangePassword() {
            // TODO: wire change-password flow
            console.log('Change password requested')
        },
        handleDisconnect() {
            this.showProfileModal = false
            this.showConfirmDisconnect = true
        },
        doDisconnect() {
            this.showConfirmDisconnect = false
            console.log('User disconnected')
            // this.$emit('disconnect') — uncomment when parent handles it
        },
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

    h2,
    h3 {
        text-align: center;
        margin: 0;
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
        margin: 10px 0px;
        border: solid 2px var(--gray-scale-3);
        border-radius: 2px;
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

        h3 {
            margin-left: 10px;
        }
    }

    .body {
        flex: 1;
        overflow-y: auto;

        h3 {
            margin: 10px 0 10px 0;
        }

        .buttons-container,
        .radio-container,
        .range-container,
        .multi-range-container, 
        .image-container,
        .text-container,
        .signup-container,
        .profile-container {
            margin: 0 0 30px 0;
        }

        .buttons-container {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
        }

        .range-container {
            padding: 0px 10px;
        }

        .text-container {
            p {
                margin-top: 10px;
                color: var(--gray-scale-7);
                text-align: left;
                font-size: 0.9rem;
                font-weight: 800;
            }
        }

        .profile-container {
            cursor: pointer;
        }
    }
}
</style>
