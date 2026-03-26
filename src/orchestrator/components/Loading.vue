<template>
    <Transition name="loading-fade">
        <div v-if="modelValue" class="loading-overlay" role="status" aria-label="Cargando">
            <div class="loading-backdrop" @click.self="onBackdropClick"></div>
            <div class="loading-content">
                <div class="loading-spinner">
                    <div class="loading-spinner__ring"></div>
                    <div class="loading-spinner__ring"></div>
                    <div class="loading-spinner__ring"></div>
                </div>
                <p v-if="message" class="loading-message">{{ message }}</p>
            </div>
        </div>
    </Transition>
</template>

<script>
export default {
    name: "Loading",
    props: {
        modelValue: {
            type: Boolean,
            default: false,
        },
        message: {
            type: String,
            default: "",
        },
        closable: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["update:modelValue", "close"],
    methods: {
        onBackdropClick() {
            if (this.closable) {
                this.$emit("update:modelValue", false);
                this.$emit("close");
            }
        },
    },
};
</script>

<style lang="scss" scoped>
.loading-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
}

.loading-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 40px 48px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.loading-message {
    margin: 0;
    font-size: var(--font-md-size);
    font-weight: var(--font-weight-medium);
    color: var(--gray-scale-7);
    text-align: center;
}

/* Spinner */
.loading-spinner {
    position: relative;
    width: 56px;
    height: 56px;
}

.loading-spinner__ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 4px solid transparent;
    border-top-color: var(--primary-color);
    animation: loading-spin linear infinite;
}

.loading-spinner__ring:nth-child(1) {
    animation-duration: 1s;
}

.loading-spinner__ring:nth-child(2) {
    inset: 8px;
    border-top-color: var(--tertiary-color);
    animation-duration: 0.75s;
    animation-direction: reverse;
}

.loading-spinner__ring:nth-child(3) {
    inset: 16px;
    border-top-color: var(--other-color-1);
    animation-duration: 0.5s;
}

@keyframes loading-spin {
    to {
        transform: rotate(360deg);
    }
}

/* Transition */
.loading-fade-enter-active,
.loading-fade-leave-active {
    transition: opacity 0.25s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
    opacity: 0;
}
</style>
