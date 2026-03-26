<template>
    <div class="select" :class="{ open: isOpen, disabled: disabled }" ref="container">
        <button
            class="select__trigger"
            :disabled="disabled"
            @click="toggleDropdown"
            type="button"
        >
            <span class="select__label">{{ selectedLabel }}</span>
            <span class="select__chevron">
                <b-icon icon="chevron-down"></b-icon>
            </span>
        </button>
        <transition name="dropdown-fade">
            <ul v-if="isOpen" class="select__dropdown">
                <li
                    v-for="option in options"
                    :key="option.value"
                    class="select__option"
                    :class="{ selected: value === option.value }"
                    @click="selectOption(option)"
                >
                    {{ option.label }}
                </li>
            </ul>
        </transition>
    </div>
</template>

<script>
export default {
    name: 'Selector',
    props: {
        value: { type: String, default: null },
        placeholder: { type: String, default: 'Selecciona' },
        options: { type: Array, default: () => [] },
        disabled: { type: Boolean, default: false },
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
            if (this.disabled) return;
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
.select {
    position: relative;
    min-width: 140px;
    display: inline-block;

    &__trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        width: 100%;
        padding: 0.4rem 0.85rem;
        background: #5183e7;
        border: 1px solid #5183e7;
        border-radius: 999px;
        color: white;
        font-size: var(--font-sm-size);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        white-space: nowrap;
        transition: background-color 0.15s ease;

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }

    &__label {
        flex: 1;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
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
        background-color: #ffffff;
        color: #3d52d5;
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
        left: 0;
        min-width: 100%;
        background-color: #5183e7;
        border: 1px solid #5183e7;
        border-radius: 0.5rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        list-style: none;
        margin: 0;
        padding: 0.25rem 0;
        z-index: 1000;
        overflow: hidden;
    }

    &__option {
        padding: 0.5rem 1rem;
        color: var(--gray-scale-1, #fff);
        font-size: var(--font-sm-size, 0.8rem);
        font-weight: var(--font-weight-regular, 400);
        cursor: pointer;
        white-space: nowrap;
        transition: background-color 0.1s ease;

        &:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        &.selected {
            background-color: rgba(255, 255, 255, 0.2);
            font-weight: var(--font-weight-medium, 500);
        }
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
