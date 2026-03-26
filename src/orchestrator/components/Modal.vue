<template>
    <transition name="modal-fade">
        <div v-if="value" class="modal-backdrop" @click.self="close">
            <div class="modal-card">
                <slot />
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'Modal',
    props: {
        value: { type: Boolean, default: false },
    },
    methods: {
        close() {
            this.$emit('input', false)
        }
    }
}
</script>

<style lang="scss" scoped>
.modal-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    opacity: 1 !important;
}

.modal-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 2rem 2.5rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    min-width: 280px;
    max-width: 90vw;
    position: relative;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s ease;
    .modal-card {
        transition: none;
    }
}
.modal-fade-enter,
.modal-fade-leave-to {
    opacity: 0;
}
</style>
