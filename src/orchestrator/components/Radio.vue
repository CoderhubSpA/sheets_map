<template>
    <div class="radio-group">
        <button
            v-for="option in options"
            :key="option.value"
            class="radio"
            :class="{ active: modelValue === option.value }"
            @click="emitValue(option.value)"
        >
            <span
                class="radio__circle"
                :style="{ background: option.color }"
            ></span>
            <span class="radio__label">{{ option.label }}</span>
        </button>
    </div>
</template>

<script>
export default {
    props: {
        options: {
            type: Array,
            default: () => [],
            // Expected shape: [{ value: any, label: String, color: String }]
        },
        modelValue: {
            default: null,
        },
    },
    emits: ['update:modelValue'],
    methods: {
        emitValue(value) {
            this.$emit('update:modelValue', value);
            console.log("Emitted value BubbleRadio:", value);
        },
    },
}
</script>

<style lang="scss" scoped>
.radio-group {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 6px;
}

.radio {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 50px;
    padding: 6px 12px;
    background-color: #fff;
    border: solid 1px #8f8f8f42;
    border-radius: 10px;
    color: #00000067;
    font-size: 0.7rem;
    font-weight: 300;
    transition: border-color 0.15s, background-color 0.15s;
    cursor: pointer;

    &.active {
        background-color: none;
        color: #000;
        border-color: var(--primary-color);
    }

    &__circle {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: block;
        flex-shrink: 0;
        border: 1.5px solid rgba(0, 0, 0, 0.15);
    }

    &__label {
        line-height: 1;
        white-space: nowrap;
    }
}
</style>
