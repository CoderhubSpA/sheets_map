<template>
    <div class="range-container">
        <div class="range-labels">
            <label>
                <strong>Desde</strong>
                <span
                    v-if="!editingFrom"
                    class="range-value-text"
                    @click="activateFrom"
                >{{ fromValue }}</span>
                <input
                    v-else
                    ref="inputFrom"
                    type="number"
                    class="range-text-input"
                    :class="{ 'range-text-input--error': errorFrom }"
                    :min="min"
                    :max="toValue"
                    :step="step"
                    v-model.number="fromValue"
                    @input="validateFrom"
                    @change="onFromInput"
                    @blur="onFromBlur"
                    @keyup.enter="onFromBlur"
                />
                <span v-show="errorFrom" class="range-error">{{ errorFrom }}</span>
            </label>
            <label>
                <strong>Hasta</strong>
                <span
                    v-if="!editingTo"
                    class="range-value-text"
                    @click="activateTo"
                >{{ toValue }}</span>
                <input
                    v-else
                    ref="inputTo"
                    type="number"
                    class="range-text-input"
                    :class="{ 'range-text-input--error': errorTo }"
                    :min="fromValue"
                    :max="max"
                    :step="step"
                    v-model.number="toValue"
                    @input="validateTo"
                    @change="onToInput"
                    @blur="onToBlur"
                    @keyup.enter="onToBlur"
                />
                <span v-show="errorTo" class="range-error">{{ errorTo }}</span>
            </label>
        </div>
        <div class="range-track-wrapper">
            <div class="range-fill" :style="fillStyle"></div>
            <input
                type="range"
                class="range-input range-from"
                :min="min"
                :max="max"
                :step="step"
                v-model.number="fromValue"
                @input="onFromInput"
            />
            <input
                type="range"
                class="range-input range-to"
                :min="min"
                :max="max"
                :step="step"
                v-model.number="toValue"
                @input="onToInput"
            />
        </div>
    </div>
</template>

<script>
export default {
    props: {
        min: {
            type: Number,
            default: 0,
        },
        max: {
            type: Number,
            default: 593,
        },
        step: {
            type: Number,
            default: 1,
        },
        defaultFrom: {
            type: Number,
            default: null,
        },
        defaultTo: {
            type: Number,
            default: null,
        },
    },
    data() {
        const initialFrom = this.defaultFrom !== null ? this.defaultFrom : this.min;
        const initialTo = this.defaultTo !== null ? this.defaultTo : this.max;
        return {
            fromValue: initialFrom,
            toValue: initialTo,
            lastValidFrom: initialFrom,
            lastValidTo: initialTo,
            editingFrom: false,
            editingTo: false,
            errorFrom: "",
            errorTo: "",
            _fromTimer: null,
            _toTimer: null,
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
        fillStyle() {
            const range = this.max - this.min;
            const clampedFrom = Math.min(Math.max(this.fromValue, this.min), this.max);
            const clampedTo = Math.min(Math.max(this.toValue, this.min), this.max);
            const left = ((clampedFrom - this.min) / range) * 100;
            const right = 100 - ((clampedTo - this.min) / range) * 100;
            return {
                left: `${left}%`,
                right: `${right}%`,
            };
        },
    },
    methods: {
        activateFrom() {
            this.editingFrom = true;
            this.$nextTick(() => this.$refs.inputFrom && this.$refs.inputFrom.focus());
        },
        activateTo() {
            this.editingTo = true;
            this.$nextTick(() => this.$refs.inputTo && this.$refs.inputTo.focus());
        },
        validateFrom() {
            if (isNaN(this.fromValue) || this.fromValue === null) {
                this.errorFrom = "Ingrese un número válido.";
            } else if (this.fromValue < this.min) {
                this.errorFrom = `Mínimo permitido: ${this.min}.`;
            } else if (this.fromValue > this.toValue) {
                this.errorFrom = `No puede superar el valor Hasta (${this.toValue}).`;
            } else {
                this.errorFrom = "";
            }
        },
        validateTo() {
            if (isNaN(this.toValue) || this.toValue === null) {
                this.errorTo = "Ingrese un número válido.";
            } else if (this.toValue > this.max) {
                this.errorTo = `Máximo permitido: ${this.max}.`;
            } else if (this.toValue < this.fromValue) {
                this.errorTo = `No puede ser menor al valor Desde (${this.fromValue}).`;
            } else {
                this.errorTo = "";
            }
        },
        onFromBlur() {
            if (this.fromValue === "" || this.fromValue === null || isNaN(this.fromValue)) {
                this.fromValue = this.lastValidFrom;
            } else {
                if (this.fromValue < this.min) this.fromValue = this.min;
                if (this.fromValue > this.toValue) this.fromValue = this.toValue;
                this.lastValidFrom = this.fromValue;
            }
            this.errorFrom = "";
            this.editingFrom = false;
            this.$emit("change", { from: this.fromValue, to: this.toValue });
            console.log("Emitted value MultiRange:", { from: this.fromValue, to: this.toValue });
        },
        onToBlur() {
            if (this.toValue === "" || this.toValue === null || isNaN(this.toValue)) {
                this.toValue = this.lastValidTo;
            } else {
                if (this.toValue > this.max) this.toValue = this.max;
                if (this.toValue < this.fromValue) this.toValue = this.fromValue;
                this.lastValidTo = this.toValue;
            }
            this.errorTo = "";
            this.editingTo = false;
            this.$emit("change", { from: this.fromValue, to: this.toValue });
            console.log("Emitted value MultiRange:", { from: this.fromValue, to: this.toValue });
        },
        onFromInput() {
            if (this.fromValue === "" || this.fromValue === null || isNaN(this.fromValue)) return;
            if (this.fromValue < this.min) this.fromValue = this.min;
            if (this.fromValue > this.toValue) this.fromValue = this.toValue;
            this.lastValidFrom = this.fromValue;
            clearTimeout(this._fromTimer);
            this._fromTimer = setTimeout(() => {
                this.$emit("change", { from: this.fromValue, to: this.toValue });
                console.log("Emitted value MultiRange:", { from: this.fromValue, to: this.toValue });
            }, 800);
        },
        onToInput() {
            if (this.toValue === "" || this.toValue === null || isNaN(this.toValue)) return;
            if (this.toValue > this.max) this.toValue = this.max;
            if (this.toValue < this.fromValue) this.toValue = this.fromValue;
            this.lastValidTo = this.toValue;
            clearTimeout(this._toTimer);
            this._toTimer = setTimeout(() => {
                this.$emit("change", { from: this.fromValue, to: this.toValue });
                console.log("Emitted value MultiRange:", { from: this.fromValue, to: this.toValue });
            }, 800);
        },
    },
};
</script>

<style lang="scss" scoped>
.range-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1rem;
    color: var(--gray-scale-7);
    margin-bottom: 22px;
    gap: 8px;

    strong {
        font-size: var(--font-lg-size);
    }
}

.range-labels label {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    position: relative;
}

.range-error {
    position: absolute;
    top: 100%;
    left: 0;
    font-size: 0.7rem;
    color: var(--other-color-2);
    margin-top: 2px;
    white-space: nowrap;
    pointer-events: none;
}

.range-text-input {
    width: 30px;
    padding: 2px 4px;
    font-size: 0.8rem;
    border: 1px solid var(--gray-scale-3);
    border-radius: 4px;
    text-align: center;
    outline: none;
    color: var(--gray-scale-6);
}

.range-value-text {
    display: inline-block;
    min-width: 20px;
    padding: 0 2px;
    color: var(--gray-scale-7);
    text-align: center;
    font-size: var(--font-lg-size);
    font-weight: var(--font-weight-bold);
    cursor: text;
}

.range-value-text:hover {
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    border-radius: 3px;
}

.range-text-input:focus {
    border-color: var(--primary-color);
}

.range-text-input--error {
    border-color: var(--other-color-2) !important;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--other-color-2) 20%, transparent) !important;
}

/* Ocultar flechas en Chrome/Safari */
.range-text-input::-webkit-outer-spin-button,
.range-text-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Ocultar flechas en Firefox */
.range-text-input[type=number] {
    appearance: textfield;
    -moz-appearance: textfield;
}

.range-track-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    height: 20px;
}

.range-track-wrapper::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 4px;
    background: #dee2e6;
    border-radius: 2px;
    pointer-events: none;
}

.range-fill {
    position: absolute;
    height: 6px;
    background: var(--primary-color);
    border-radius: 2px;
    pointer-events: none;
    z-index: 1;
}

.range-input {
    position: absolute;
    width: 100%;
    height: 6px;
    background: transparent;
    appearance: none;
    -webkit-appearance: none;
    overflow: visible;
    pointer-events: none;
    z-index: 2;
}

.range-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--primary-color);
    border: none;
    box-shadow: none;
    pointer-events: all;
    z-index: 3;
    transition: box-shadow 0.2s ease;
    cursor: pointer;
}

.range-input:hover::-webkit-slider-thumb {
    box-shadow: 0 0 0 10px color-mix(in srgb, var(--primary-color) 15%, transparent);
}

.range-input::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--primary-color);
    border: none;
    box-shadow: none;
    pointer-events: all;
    cursor: pointer;
    transition: box-shadow 0.2s ease;
}

.range-input:hover::-moz-range-thumb {
    box-shadow: 0 0 0 10px color-mix(in srgb, var(--primary-color) 15%, transparent);
}

.range-steps {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--gray-scale-7);
    margin-top: 6px;
}
</style>
