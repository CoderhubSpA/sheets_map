<template>
    <generic-modal v-model="showModal">
        <div class="tooltip-modal">
            <!-- Header -->
            <div class="tooltip-modal__header">
                <span class="tooltip-modal__title">{{ layerName }}</span>
                <button class="tooltip-modal__close" title="Cerrar" @click="close">
                    <b-icon icon="x-lg"></b-icon>
                </button>
            </div>

            <!-- Body: fields + image -->
            <div class="tooltip-modal__body">
                <div class="tooltip-modal__fields">
                    <div
                        v-for="field in displayFields"
                        :key="field.id"
                        class="tooltip-modal__field"
                    >
                        <span class="tooltip-modal__field-label">{{ field.name }}:</span>
                        <span class="tooltip-modal__field-value">{{ field.value }}</span>
                    </div>
                    <div v-if="displayFields.length === 0" class="tooltip-modal__empty">
                        Sin información disponible
                    </div>
                </div>
                <div v-if="imageUrl" class="tooltip-modal__image-container">
                    <img :src="imageUrl" class="tooltip-modal__image" alt="preview" />
                </div>
            </div>
        </div>
    </generic-modal>
</template>

<script>
import { BIcon } from "bootstrap-vue";
import GenericModal from "./GenericModal.vue";

export default {
    name: "FeatureDetailModal",
    components: { GenericModal, BIcon },

    props: {
        value: { type: Boolean, default: false },
        pointData: { type: Object, default: null },
    },

    computed: {
        showModal: {
            get() { return this.value; },
            set(val) { this.$emit("input", val); },
        },
        layerName() {
            if (this.pointData && this.pointData.layer && this.pointData.layer.name) {
                return this.pointData.layer.name;
            }
            return "Detalle";
        },
        displayFields() {
            if (!this.pointData) return [];
            var columns = this.pointData.visible_columns;
            var properties = this.pointData.properties || {};
            if (!columns || columns.length === 0) {
                // Mostrar todas las propiedades si no hay columnas configuradas
                return Object.keys(properties)
                    .filter(function(key) {
                        var val = properties[key];
                        return val !== null && val !== undefined && val !== "";
                    })
                    .map(function(key) {
                        return { id: key, name: key, value: properties[key] };
                    });
            }
            return columns
                .map(function(col) {
                    return {
                        id: col.id,
                        name: col.name || col.id,
                        value: properties[col.id],
                    };
                })
                .filter(function(field) {
                    return field.value !== null && field.value !== undefined && field.value !== "";
                });
        },
        imageUrl() {
            if (!this.pointData || !this.pointData.properties) return null;
            var urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
            var props = this.pointData.properties;
            var keys = Object.keys(props);
            for (var i = 0; i < keys.length; i++) {
                var val = props[keys[i]];
                if (typeof val === "string" && urlPattern.test(val)) {
                    return val;
                }
            }
            return null;
        },
    },

    methods: {
        close() {
            this.showModal = false;
        },
    },
};
</script>

<style lang="scss" scoped>
.tooltip-modal {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 380px;
    max-width: 90vw;
    height: fit-content;
    max-height: 90dvh;
    overflow-y: auto;
    background-color: #ffffff;
    padding: 24px;
    border-radius: 12px;

    // ── Header ──────────────────────────────────────────────────────
    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    &__title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-color, #212121);
        line-height: 1.2;
    }

    &__close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: #e74c3c;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.15s;
        flex-shrink: 0;

        &:hover {
            background: rgba(231, 76, 60, 0.12);
        }
    }

    // ── Body ────────────────────────────────────────────────────────
    &__body {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    // ── Fields ──────────────────────────────────────────────────────
    &__fields {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    &__field {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding: 4px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
            border-bottom: none;
        }
    }

    &__field-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #555555;
        flex-shrink: 0;
        max-width: 50%;
    }

    &__field-value {
        font-size: 0.875rem;
        color: #888888;
        text-align: right;
        word-break: break-word;
    }

    &__empty {
        font-size: 0.875rem;
        color: #aaaaaa;
        font-style: italic;
    }

    // ── Image ───────────────────────────────────────────────────────
    &__image-container {
        margin-top: 16px;
        background: #f5f5f5;
        border-radius: 8px;
        overflow: hidden;
    }

    &__image {
        width: 100%;
        display: block;
        border-radius: 8px;
    }
}
</style>
