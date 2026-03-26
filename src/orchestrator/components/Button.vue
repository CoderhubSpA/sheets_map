<template>
    <span class="button" :class="{ active: active }" @click="emitValue">{{ name }}</span>
</template>
<script>
export default {
    name: "BubbleButton",
    props: {
        name: {
            type: String,
            default: '',
        },
        value: {
            type: String,
            default: '',
        },
        active: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            inputValue: this.value,
        }
    },
    methods: {
        emitValue() {
            this.$emit('update:modelValue', this.value);
            console.log("Emitted value BubbleButton:", this.value);
        },
    }
}
</script>
<style lang="scss" scoped>
.button {
    padding: 6px 10px;
    background-color: #fff;
    border-radius: 20px;
    border: solid 1px var(--gray-scale-3);
    color: var(--gray-scale-7);
    font-size: var(--font-sm-size);
    font-weight: var(--font-weight-black);
    cursor: pointer;

    &:hover {
        background-color: rgba(233, 233, 233, 0.596);
    }

    &.active {
        background-color: var(--primary-color);
        color: var(--gray-scale-1);
        border-color: var(--primary-color);
    }
}
</style>
