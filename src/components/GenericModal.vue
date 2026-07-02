<template>
    <div class="modal-portal">
        <transition name="modal-fade">
            <div v-if="value" class="modal-backdrop" @click.self="close">
                <div :class="['modal-card', cardClass]">
                    <slot />
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
export default {
    name: "GenericModal",
    props: {
        value: { type: Boolean, default: false },
        cardClass: { type: String, default: '' },
    },
    mounted() {
        document.body.appendChild(this.$el);
    },
    beforeDestroy() {
        if (this.$el && this.$el.parentNode === document.body) {
            document.body.removeChild(this.$el);
        }
    },
    methods: {
        close() {
            this.$emit("input", false);
        },
    },
};
</script>

<style lang="scss" scoped>
.modal-portal {
    position: absolute;
    width: 0;
    height: 0;
    overflow: visible;
    pointer-events: none;
}

.modal-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    pointer-events: auto;
    opacity: 1;
}

.modal-card {
    background: #ffffff;
    border-radius: 20px;
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
