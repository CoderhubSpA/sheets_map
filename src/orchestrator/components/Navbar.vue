<template>
    <nav class="filter-navbar">
        <!-- Logo section -->
        <div class="filter-navbar__logo">
            <img
                :src="logoSrc"
                alt="BigFrut logo"
                class="filter-navbar__logo-img"
            />
        </div>

        <!-- Welcome section -->
        <div class="filter-navbar__welcome">
            <p class="filter-navbar__welcome-name">Hola {{ userName }}</p>
            <p class="filter-navbar__welcome-sub">¡Qué bueno verte de nuevo!</p>
        </div>

        <!-- Selectors section -->
        <div class="filter-navbar__selectors">
            <selector
                v-model="selectedCampo"
                placeholder="Selecciona campo"
                :options="campoOptions"
            />
            <selector
                v-model="selectedCultivo"
                placeholder="Selecciona cultivo"
                :options="cultivoOptions"
            />
            <selector
                v-model="selectedVariedad"
                placeholder="Selecciona variedad"
                :options="variedadOptions"
            />
            <selector
                v-model="selectedCuartel"
                placeholder="Selecciona cuartel"
                :options="cuartelOptions"
            />
        </div>

        <!-- Search button -->
        <button class="filter-navbar__search-btn" @click="onSearch" type="button">
            <b-icon icon="search"></b-icon>
        </button>
    </nav>
</template>

<script>
import Selector from './Selector.vue';
import logoNavbar from '../../assets/logo_navbar.png';

export default {
    name: 'Navbar',
    components: {
        Selector,
    },
    props: {
        userName: { type: String, default: 'Usuario' },
        campoOptions: { type: Array, default: () => [] },
        cultivoOptions: { type: Array, default: () => [] },
        variedadOptions: { type: Array, default: () => [] },
        cuartelOptions: { type: Array, default: () => [] },
    },
    data() {
        return {
            selectedCampo: null,
            selectedCultivo: null,
            selectedVariedad: null,
            selectedCuartel: null,
            logoSrc: logoNavbar,
        };
    },
    methods: {
        onSearch() {
            this.$emit('search', {
                campo: this.selectedCampo,
                cultivo: this.selectedCultivo,
                variedad: this.selectedVariedad,
                cuartel: this.selectedCuartel,
            });
        },
    },
};
</script>

<style lang="scss" scoped>
// Navbar background — deep blue brand color (distinct from --primary-color #4c6ef5)
$navbar-bg: #3D52D5;
$decor-pink: #F48FB1;

.filter-navbar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-height: 8dvh;
    border-radius: 50px;
    padding: 0.75rem 1.5rem 0.75rem 2.5rem;
    background-color: $navbar-bg;
    overflow: visible;
    gap: 1.5rem;

    &__logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    &__logo-img {
        height: 9.5dvh;
        position: relative;
        left: -48px;
    }

    &__logo-text {
        color: white;
        font-size: 1.3rem;
        font-weight: var(--font-weight-bold, 700);
        letter-spacing: 0.01em;
        white-space: nowrap;
    }

    &__welcome {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        flex-shrink: 0;
    }

    &__welcome-name {
        margin: 0;
        color: white;
        font-size: var(--font-md-size, 1rem);
        font-weight: var(--font-weight-bold, 700);
        line-height: 1.2;
    }

    &__welcome-sub {
        margin: 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: var(--font-sm-size, 0.8rem);
        font-weight: var(--font-weight-regular, 400);
        line-height: 1.2;
    }

    // ── Selectors ───────────────────────────────────────────────────
    &__selectors {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        flex: 1;
        flex-shrink: 1;
        justify-content: flex-end;
    }

    // ── Search button ───────────────────────────────────────────────
    &__search-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        background-color: rgba(255, 255, 255, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: white;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.15s ease;

        &:hover {
            background-color: rgba(255, 255, 255, 0.3);
        }

        &:active {
            background-color: rgba(255, 255, 255, 0.4);
        }
    }
}
</style>
