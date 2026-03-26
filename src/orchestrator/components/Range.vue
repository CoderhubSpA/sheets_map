<template>
    <div class="range-container">
        <b-form-input class="range-input" v-model="inputValue" type="range" :min="min" :max="max"
            :step="step" @input="emitValue"></b-form-input>
        <div class="range-steps">
            <span v-for="s in steps" :key="s">{{ s }}</span>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        value: {
            type: String,
            default: "3",
        },
        min: {
            type: Number,
            default: 1,
        },
        max: {
            type: Number,
            default: 7,
        },
        step: {
            type: Number,
            default: 2,
        },
    },
    data() {
        return {
            inputValue: this.value,
        };
    },
    computed: {
        steps() {
            const result = [];
            for (let i = this.min; i <= this.max; i += this.step) {
                result.push(i);
            }
            return result;
        },
    },
    methods: {
        emitValue() {
            this.$emit('update:modelValue', this.inputValue);
            console.log("Emitted value Range:", this.inputValue);
        },
    },
};
</script>

<style lang="scss" scoped>
.range-container {
    width: 100%;

    .range-steps {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-md-size);
        font-weight: 800;
        color: var(--text-color);
        margin-top: 12px;
    }

    .range-input {
        height: 5px;
        background: var(--gray-scale-3);
        border-radius: 2px;
        appearance: none;
        -webkit-appearance: none;
        padding: 0;
        cursor: pointer;

        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 22px;
            height: 22px;
            margin-top: -8px;
            border-radius: 50%;
            background: var(--primary-color);
            border: none;
            box-shadow: none;
            cursor: pointer;
            transition: box-shadow 0.2s ease;
        }

        &:hover::-webkit-slider-thumb {
            box-shadow: 0 0 0 10px color-mix(in srgb, var(--primary-color) 15%, transparent);
        }

        &::-moz-range-thumb {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: var(--primary-color);
            border: none;
            box-shadow: none;
            cursor: pointer;
            transition: box-shadow 0.2s ease;
        }

        &:hover::-moz-range-thumb {
            box-shadow: 0 0 0 10px color-mix(in srgb, var(--primary-color) 15%, transparent);
        }

        &::-webkit-slider-runnable-track {
            height: 5px;
            background: var(--gray-scale-3);
            border-radius: 2px;
        }

        &::-moz-range-track {
            height: 5px;
            background: var(--gray-scale-3);
            border-radius: 2px;
        }

        &::-moz-range-progress {
            height: 5px;
            background: var(--primary-color);
            border-radius: 2px;
        }
    }
}
</style>
