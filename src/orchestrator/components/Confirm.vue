<template>
    <div class="confirm">
        <p class="confirm__message">{{ message }}</p>
        <div class="confirm__actions">
            <button class="confirm__btn confirm__btn--accept" @click="$emit('accept')">Aceptar</button>
            <button class="confirm__btn confirm__btn--cancel" @click="$emit('cancel')">Cancelar</button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Confirm',
    props: {
        message: { type: String, default: '¿Estás seguro?' },
    },
}
</script>

<style lang="scss" scoped>
.confirm {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center;

    &__message {
        font-size: var(--font-lg-size);
        font-weight: var(--font-weight-bold);
        color: var(--text-color);
        margin: 0;
    }

    &__actions {
        display: flex;
        gap: 1rem;
    }

    &__btn {
        padding: 0.6rem 1.8rem;
        border-radius: 999px;
        border: none;
        font-size: var(--font-md-size);
        font-weight: var(--font-weight-medium);
        font-family: var(--font-family);
        color: #ffffff;
        cursor: pointer;
        transition: opacity 0.15s ease;

        &:hover { opacity: 0.85; }

        &--accept { background-color: #3D52D5; }
        &--cancel { background-color: #ff8f9d; }
    }
}
</style>
