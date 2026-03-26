<template>
    <div class="card-selector" :class="{ open: isOpen }" ref="container">
        <button
            class="card-selector__trigger"
            @click="toggleDropdown"
            type="button"
        >
            <span class="card-selector__label">{{ selectedLabel }}</span>
            <span class="card-selector__chevron">
                <b-icon icon="chevron-down"></b-icon>
            </span>
        </button>
        <transition name="dropdown-fade">
            <div v-if="isOpen" class="card-selector__dropdown">
                <div
                    v-for="option in options"
                    :key="option.value"
                    class="card-selector__option"
                    :class="{ selected: value === option.value }"
                    @click="selectOption(option)"
                >
                    <div
                        class="card-selector__option-card"
                        :class="{ active: value === option.value }"
                    >
                        <img
                            v-if="option.image"
                            :src="option.image"
                            class="card-selector__option-img"
                            alt=""
                        />
                        <div v-else class="card-selector__option-placeholder">
                            <b-icon icon="image" font-scale="1.5"></b-icon>
                        </div>
                    </div>
                    <span class="card-selector__option-label">{{ option.label }}</span>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
export default {
    name: 'CardSelector',
    props: {
        value:       { type: String, default: null },
        options:     { type: Array,  default: () => [] },
        placeholder: { type: String, default: 'Selecciona' },
    },
    data() {
        return {
            isOpen: false,
        };
    },
    computed: {
        selectedLabel() {
            if (this.value === null || this.value === undefined) {
                return this.placeholder;
            }
            const found = this.options.find(opt => opt.value === this.value);
            return found ? found.label : this.placeholder;
        },
    },
    methods: {
        toggleDropdown() {
            this.isOpen = !this.isOpen;
        },
        selectOption(option) {
            this.$emit('input', option.value);
            this.isOpen = false;
        },
        handleOutsideClick(event) {
            if (this.$refs.container && !this.$refs.container.contains(event.target)) {
                this.isOpen = false;
            }
        },
    },
    mounted() {
        document.addEventListener('click', this.handleOutsideClick);
    },
    beforeDestroy() {
        document.removeEventListener('click', this.handleOutsideClick);
    },
};
</script>

<style lang="scss" scoped>
$active-blue: #3D52D5;

.card-selector {
    position: relative;
    display: inline-block;
    overflow: visible;
    width: 100%;
    padding: 4px;

    &__trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        width: 100%;
        padding: 0.4rem 0.85rem;
        background: #fff;
        border: 1px solid #fff;
        border-radius: 999px;
        color: var(--text-color);
        font-size: var(--font-sm-size);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        white-space: nowrap;
        transition: background-color 0.15s ease;
    }

    &__label {
        flex: 1;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 16px;
    }

    &__chevron {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        min-width: 24px;
        border-radius: 50%;
        background-color: #5183e7;
        color: #fff;
        font-size: 0.55rem;
        transition: transform 0.2s ease;
        scale: 1.2;
        border: solid 1px #fff;
    }

    &.open &__chevron {
        transform: rotate(180deg);
    }

    &__dropdown {
        position: absolute;
        top: calc(100% + 6px);
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
        z-index: 1000;
        width: 96%;
    }

    &__option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: background-color 0.1s ease;

        &:hover {
            background-color: var(--gray-scale-2);
        }
    }

    &__option-card {
        width: 70px;
        height: 70px;
        border-radius: 8px;
        border: 4px solid var(--gray-scale-3);
        background-color: var(--gray-scale-2);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: border-color 0.15s ease;

        &.active {
            border-color: $active-blue;
        }
    }

    &__option-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &__option-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--gray-scale-4);
    }

    &__option-label {
        font-size: var(--font-sm-size);
        color: var(--text-color);
        white-space: nowrap;
        text-align: center;
    }
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-fade-enter,
.dropdown-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
</style>
