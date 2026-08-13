<template>
    <b-modal
        v-model="visibleProxy"
        size="xl"
        centered
        modal-class="vector-tile-settings-modal"
        dialog-class="vector-tile-settings-dialog"
        content-class="vector-tile-settings-content"
        body-class="vector-tile-settings-body"
        hide-footer
        title="Configuración de capa vectorial"
        @hidden="cancelRequests"
    >
        <nav class="settings-tabs" role="tablist" aria-label="Secciones de configuración">
            <button type="button" class="settings-tab" :class="{ 'settings-tab--active': activeTab === 'symbology' }"
                role="tab" :aria-selected="String(activeTab === 'symbology')" aria-controls="symbology-panel"
                @click="activeTab = 'symbology'">
                <span class="settings-tab__icon" aria-hidden="true">◈</span>
                <span><strong>Simbología y leyenda</strong><small>Estilo, clases y vista previa</small></span>
            </button>
            <button type="button" class="settings-tab" :class="{ 'settings-tab--active': activeTab === 'filters' }"
                role="tab" :aria-selected="String(activeTab === 'filters')" aria-controls="filters-panel"
                @click="activeTab = 'filters'">
                <span class="settings-tab__icon" aria-hidden="true">⌁</span>
                <span><strong>Filtros</strong><small>Transparencia y selección</small></span>
            </button>
        </nav>

        <div class="settings-workspace">
            <section v-show="activeTab === 'symbology'" id="symbology-panel" class="settings-panel" role="tabpanel">
                <vector-tile-symbology-editor
                    v-if="draft"
                    :draft="draft"
                    :attributes="attributes"
                    :loading="loadingLegend"
                    :error="legendError"
                    :layer="layer"
                    :semantic-legend="semanticLegend"
                    :spatial-context="spatialContext"
                    @update:draft="draft = $event"
                    @attribute-change="loadAttributeLegend"
                />
            </section>

            <section v-show="activeTab === 'filters'" id="filters-panel" class="settings-panel filter-panel" role="tabpanel">
                <div class="filter-panel__heading">
                    <h5>Filtros y transparencia</h5>
                    <p>Ajusta la visibilidad de la capa para el contexto actual del visor.</p>
                </div>
                <div class="filter-card">
                    <label class="filter-control filter-control--opacity">
                        <span>Nivel de transparencia</span>
                        <div class="opacity-control">
                            <input v-model.number="opacity" type="range" min="0" max="1" step="0.05">
                            <output>{{ Math.round(opacity * 100) }}%</output>
                        </div>
                    </label>
                    <label class="filter-control filter-control--attribute">
                        <span>Filtrar por atributo</span>
                        <select v-model="filterAttribute">
                            <option value="">Sin filtro</option>
                            <option v-for="attribute in attributes" :key="attribute" :value="attribute">{{ attribute }}</option>
                        </select>
                    </label>
                    <label class="filter-control filter-control--value">
                        <span>Valor del filtro</span>
                            <input v-model="filterValue" type="text" :disabled="!filterAttribute" placeholder="Ingresa el valor a buscar">
                    </label>
                </div>
            </section>

            <div v-if="validationErrors.length" class="alert alert-danger validation-summary" role="alert">
                        <strong>Revisa la configuración antes de continuar:</strong>
                <div v-for="error in validationErrors" :key="error">{{ error }}</div>
            </div>

            <section v-if="manualJsonVisible" class="manual-json" aria-labelledby="generated-json-title">
            <h5 id="generated-json-title">JSON generado</h5>
                        <p>Selecciona el contenido y cópialo manualmente.</p>
            <textarea
                ref="manualJson"
                :value="generatedJson"
                readonly
                rows="8"
                aria-label="Configuración de leyenda en JSON"
                @focus="$event.target.select()"
            ></textarea>
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="selectGeneratedJson">
                Seleccionar JSON
            </button>
            </section>
        </div>

        <footer class="settings-footer">
            <span v-show="copyFeedback" class="copy-feedback" :class="{ 'copy-feedback--error': copyError }" aria-live="polite" role="status">{{ copyFeedback }}</span>
            <button type="button" class="btn btn-outline-secondary" :disabled="!canCopy" @click="copySerializedLegendConfig">Copiar JSON</button>
            <button type="button" class="btn btn-secondary" @click="visibleProxy = false">Cancelar</button>
            <button type="button" class="btn btn-primary" :disabled="loading || !geometryResolved" @click="applyAndClose">Aplicar en el visor</button>
        </footer>
    </b-modal>
</template>

<script>
import { BModal } from 'bootstrap-vue'
import { fetchVectorTileAttributes } from '../services/vectorTileAttributesService'
import { fetchVectorTileSemanticLegend } from '../services/vectorTileLegendService'
import {
    applySemanticLegendToDraft,
    createVectorTileLegendDraft,
    stringifyVectorTileLegendConfig,
    validateVectorTileLegendDraft,
} from '../utils/vectorTileLegend/editor'
import { normalizeVectorTileSpatialContext } from '../utils/vectorTileLegend/preview'
import VectorTileSymbologyEditor from './VectorTileSymbologyEditor.vue'
import { COPY_ERROR_MESSAGE, COPY_SUCCESS_MESSAGE, copyText } from '../utils/clipboard'

function formatRequestError(error, fallback) {
    const status = error?.response?.status
    if (status === 404) return 'La capa no fue encontrada en el servicio vectorial.'
    const detail = error?.response?.data
    if (typeof detail === 'string' && detail.trim()) return detail
    return fallback
}

export default {
    name: 'VectorTileLayerSettingsModal',
    components: { BModal, VectorTileSymbologyEditor },
    props: {
        visible: { type: Boolean, default: false },
        layer: { type: Object, default: null },
        copyHandler: { type: Function, default: null },
    },
    data() {
        return {
            attributes: [],
            draft: null,
            opacity: 1,
            filterAttribute: '',
            filterValue: '',
            loadingAttributes: false,
            loadingLegend: false,
            legendError: '',
            semanticLegend: null,
            spatialContext: { bbox: null, centroid: null },
            validationErrors: [],
            copyFeedback: '',
            copyError: false,
            copyFeedbackTimer: null,
            requestId: 0,
            abortController: null,
            geometryResolved: false,
            generatedJson: '',
            manualJsonVisible: false,
            activeTab: 'symbology',
        }
    },
    computed: {
        visibleProxy: {
            get() { return this.visible },
            set(value) { this.$emit('update:visible', value) },
        },
        loading() { return this.loadingAttributes || this.loadingLegend },
        canCopy() {
            return Boolean(this.draft) && !this.loading && this.validateState().length === 0
        },
    },
    watch: {
        visible(visible) { if (visible) this.initialize() },
    },
    beforeDestroy() {
        this.clearCopyFeedbackTimer()
    },
    methods: {
        validateState() {
            const errors = this.draft ? validateVectorTileLegendDraft(this.draft) : ['La configuración no está disponible.']
            if (!this.geometryResolved) errors.push('No fue posible validar la geometría de la capa.')
            return errors
        },
        cancelRequests() {
            this.requestId += 1
            this.abortController?.abort()
            this.abortController = null
            this.clearCopyFeedbackTimer()
        },
        clearCopyFeedbackTimer() {
            if (!this.copyFeedbackTimer) return
            clearTimeout(this.copyFeedbackTimer)
            this.copyFeedbackTimer = null
        },
        showCopyFeedback(message, isError = false, duration = 2000) {
            this.clearCopyFeedbackTimer()
            this.copyFeedback = message
            this.copyError = isError
            this.copyFeedbackTimer = setTimeout(() => {
                this.copyFeedback = ''
                this.copyError = false
                this.copyFeedbackTimer = null
            }, duration)
        },
        async initialize() {
            if (!this.layer) return
            this.cancelRequests()
            const requestId = ++this.requestId
            this.abortController = new AbortController()
            this.validationErrors = []
            this.copyFeedback = ''
            this.generatedJson = ''
            this.manualJsonVisible = false
            this.activeTab = 'symbology'
            this.legendError = ''
            this.semanticLegend = null
            this.spatialContext = { bbox: null, centroid: null }
            this.geometryResolved = false
            this.opacity = Number(this.layer.opacity ?? 1)
            this.filterAttribute = this.layer.filterAttribute || ''
            this.filterValue = this.layer.filterValue ?? ''
            this.draft = createVectorTileLegendDraft(this.layer)
            this.loadingAttributes = true
            this.loadingLegend = true

            const params = {
                tileUrl: this.layer.url,
                layerName: this.draft.layerName,
                signal: this.abortController.signal,
            }
            const [attributesResult, defaultLegendResult] = await Promise.allSettled([
                fetchVectorTileAttributes(params),
                fetchVectorTileSemanticLegend(params),
            ])
            if (requestId !== this.requestId) return

            if (attributesResult.status === 'fulfilled' && Array.isArray(attributesResult.value?.attributes) && attributesResult.value.attributes.length) {
                this.attributes = attributesResult.value.attributes
            } else {
                this.attributes = []
                this.legendError = attributesResult.status === 'rejected'
                    ? formatRequestError(attributesResult.reason, 'No fue posible cargar los atributos de la capa.')
                    : 'La capa no informó atributos disponibles.'
            }

            this.spatialContext = normalizeVectorTileSpatialContext(
                defaultLegendResult.status === 'fulfilled' ? defaultLegendResult.value : null,
                attributesResult.status === 'fulfilled' ? attributesResult.value : null,
            )

            if (defaultLegendResult.status === 'fulfilled' && defaultLegendResult.value) {
                this.semanticLegend = defaultLegendResult.value
                this.geometryResolved = Boolean(defaultLegendResult.value.geometry_type)
                this.draft = {
                    ...this.draft,
                    geometryType: defaultLegendResult.value.geometry_type || this.draft.geometryType,
                }
            } else if (defaultLegendResult.status === 'rejected' && !this.legendError) {
                this.legendError = formatRequestError(defaultLegendResult.reason, 'No fue posible obtener la geometría de la capa.')
            }
            this.loadingAttributes = false
            this.loadingLegend = false

            if (this.draft.mode === 'thematic' && this.draft.attribute) {
                await this.loadAttributeLegend(this.draft.attribute)
            }
        },
        async loadAttributeLegend(attribute) {
            if (!this.draft) return
            const items = this.draft.attribute === attribute ? this.draft.items : []
            this.draft = { ...this.draft, attribute, items }
            this.semanticLegend = null
            this.legendError = ''
            if (!attribute) return

            this.abortController?.abort()
            const requestId = ++this.requestId
            this.abortController = new AbortController()
            this.loadingLegend = true
            try {
                const semanticLegend = await fetchVectorTileSemanticLegend({
                    tileUrl: this.layer.url,
                    layerName: this.draft.layerName,
                    attribute,
                    signal: this.abortController.signal,
                })
                if (requestId !== this.requestId) return

                const returnedAttribute = semanticLegend?.attribute
                const hasClasses = Array.isArray(semanticLegend?.classes) && semanticLegend.classes.length > 0
                const hasRanges = Array.isArray(semanticLegend?.ranges) && semanticLegend.ranges.length > 0
                const isText = String(semanticLegend?.legend_type || '').toLowerCase() === 'text'
                if (!semanticLegend || returnedAttribute !== attribute || (!hasClasses && !hasRanges && !isText)) {
                    throw new Error('ATTRIBUTE_WITHOUT_LEGEND')
                }
                this.semanticLegend = semanticLegend
                this.spatialContext = normalizeVectorTileSpatialContext(
                    semanticLegend,
                    this.spatialContext,
                )
                this.draft = applySemanticLegendToDraft(this.draft, semanticLegend)
            } catch (error) {
                if (requestId !== this.requestId) return
                this.draft = { ...this.draft, items }
                this.semanticLegend = null
                this.legendError = error.message === 'ATTRIBUTE_WITHOUT_LEGEND'
                    ? 'El servicio no devolvió una segmentación válida para el atributo seleccionado.'
                    : formatRequestError(error, 'No fue posible cargar la segmentación del atributo.')
            } finally {
                if (requestId === this.requestId) this.loadingLegend = false
            }
        },
        save(event) {
            this.validationErrors = this.validateState()
            if (this.validationErrors.length) {
                this.activeTab = 'symbology'
                event?.preventDefault()
                return
            }
            this.$emit('apply', {
                layerKey: this.layer.key,
                opacity: this.opacity,
                filterAttribute: this.filterAttribute,
                filterValue: this.filterAttribute ? this.filterValue : '',
                legendConfig: stringifyVectorTileLegendConfig(this.draft),
            })
        },
        applyAndClose() {
            this.save()
            if (this.validationErrors.length === 0) this.visibleProxy = false
        },
        copySerializedLegendConfig() {
            if (!this.canCopy) return
            this.validationErrors = this.validateState()
            if (this.validationErrors.length) {
                this.activeTab = 'symbology'
                return
            }
            this.generatedJson = stringifyVectorTileLegendConfig(this.draft)
            this.copyFeedback = ''
            this.copyError = false
            this.manualJsonVisible = false
            const writer = this.copyHandler || copyText
            Promise.resolve(writer(this.generatedJson))
                .then(success => {
                    if (success === false) {
                        this.showManualCopyFallback()
                        return
                    }
                    this.showCopyFeedback(COPY_SUCCESS_MESSAGE)
                })
                .catch(() => this.showManualCopyFallback())
        },
        showManualCopyFallback() {
            this.showCopyFeedback(COPY_ERROR_MESSAGE, true, 6000)
            this.manualJsonVisible = true
            this.$nextTick(() => this.selectGeneratedJson())
        },
        selectGeneratedJson() {
            const textarea = this.$refs.manualJson
            if (!textarea) return
            textarea.focus()
            textarea.select()
        },
    },
}
</script>

<style scoped>
.settings-tabs { z-index: 4; display: flex; flex: 0 0 auto; gap: 4px; padding: 12px 24px 0; border-bottom: 1px solid #dce4eb; background: #f7f9fb; }
.settings-tab { position: relative; display: flex; min-width: 230px; align-items: center; gap: 11px; padding: 11px 16px 13px; border: 0; border-radius: 8px 8px 0 0; color: #607181; background: transparent; text-align: left; cursor: pointer; }
.settings-tab::after { position: absolute; right: 0; bottom: -1px; left: 0; height: 3px; border-radius: 3px 3px 0 0; background: transparent; content: ''; }
.settings-tab:hover { color: #234d73; background: #edf4fa; }
.settings-tab--active { color: #0b5cad; background: #fff; box-shadow: 0 -1px 0 #dce4eb, 1px 0 0 #dce4eb, -1px 0 0 #dce4eb; }
.settings-tab--active::after { background: #1473c9; }
.settings-tab__icon { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border-radius: 7px; color: #0b5cad; background: #e6f1fb; font-size: 1rem; }
.settings-tab > span:last-child { display: flex; flex-direction: column; gap: 2px; }
.settings-tab strong { font-size: .83rem; }
.settings-tab small { font-size: .67rem; font-weight: 400; }
.settings-workspace { min-height: 0; flex: 1 1 auto; overflow-y: auto; padding: 22px 24px 28px; scrollbar-width: none; }
.settings-workspace::-webkit-scrollbar { width: 0; height: 0; }
.settings-panel { min-height: 220px; }
.filter-panel { max-width: 980px; }
.filter-panel__heading { margin-bottom: 18px; }
.filter-panel__heading h5 { margin: 0; color: #263746; font-size: 1.05rem; font-weight: 700; }
.filter-panel__heading p { margin: 5px 0 0; color: #687887; font-size: .8rem; }
.filter-card { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; padding: 20px; border: 1px solid #dbe3ea; border-radius: 10px; background: #fff; }
.filter-control { display: flex; min-width: 0; flex-direction: column; gap: 7px; color: #344554; font-size: .78rem; font-weight: 700; }
.filter-control--opacity { grid-column: 1 / -1; }
.filter-control--opacity .opacity-control { width: calc((100% - 18px) / 2); }
.filter-control--attribute { grid-column: 1; }
.filter-control--value { grid-column: 2; }
.filter-control input, .filter-control select { box-sizing: border-box; width: 100%; min-height: 40px; border: 1px solid #cbd6df; border-radius: 6px; padding: 7px 12px; color: #263746; background-color: #fff; font-size: .875rem; font-weight: 400; outline: none; }
.filter-control select { appearance: none; padding-right: 38px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20'%3E%3Cpath fill='none' stroke='%23344554' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m5 7.5 5 5 5-5'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 14px; }
.filter-control input:focus, .filter-control select:focus { border-color: #3b82c4; box-shadow: 0 0 0 3px rgba(59, 130, 196, .16); }
.filter-control input:disabled { color: #82909d; background: #eef2f5; }
.opacity-control { display: flex; align-items: center; gap: 14px; }
.opacity-control input { flex: 1; padding: 0; border: 0; accent-color: #1473c9; }
.opacity-control output { min-width: 60px; padding: 7px 9px; border: 1px solid #d8e0e7; border-radius: 6px; color: #0b5cad; background: #f2f7fb; font-size: .78rem; font-weight: 800; text-align: center; }
.validation-summary { margin: 18px 0 0; }
.copy-feedback { display: inline-flex; min-height: 38px; align-items: center; margin-right: auto; padding: 7px 14px; border-radius: 999px; color: #fff; background: #6c757d; box-shadow: 0 3px 10px rgba(38, 55, 70, .28); font-size: .875rem; font-weight: 600; white-space: nowrap; }
.copy-feedback--error { background: #b54747; }
.settings-footer { display: flex; flex: 0 0 auto; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 24px; border-top: 1px solid #dee2e6; background: #fff; }
.manual-json { margin-top: 16px; padding: 12px; border: 1px solid #ced4da; border-radius: 6px; background: #f8f9fa; }
.manual-json h5 { margin-bottom: 4px; }
.manual-json p { margin-bottom: 8px; font-size: 0.85rem; }
.manual-json textarea { width: 100%; resize: vertical; font-family: monospace; font-size: 0.78rem; }
@media (max-width: 700px) { .settings-tabs { padding-right: 12px; padding-left: 12px; } .settings-tab { min-width: 0; flex: 1; padding: 10px; } .settings-tab small { display: none; } .settings-workspace { padding: 16px 12px 22px; } .filter-card { grid-template-columns: 1fr; padding: 16px; } .filter-control--opacity, .filter-control--attribute, .filter-control--value { grid-column: 1; } .filter-control--opacity .opacity-control { width: 100%; } }
</style>

<style>
/* BootstrapVue mueve el modal a <body>; estas clases exclusivas evitan afectar otros modales. */
.vector-tile-settings-modal {
    overflow: hidden;
}

.vector-tile-settings-dialog .vector-tile-settings-content {
    position: relative;
    max-height: calc(100vh - 2rem);
    max-height: calc(100dvh - 2rem);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.vector-tile-settings-dialog.modal-dialog {
    width: auto;
    max-width: min(1440px, calc(100vw - 32px));
    margin-right: auto;
    margin-left: auto;
}

.vector-tile-settings-dialog .modal-header,
.vector-tile-settings-dialog .modal-footer {
    flex: 0 0 auto;
    padding-right: 24px;
    padding-left: 24px;
}

.vector-tile-settings-dialog .vector-tile-settings-body {
    display: flex;
    min-height: 0;
    flex: 1 1 auto;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    overscroll-behavior: contain;
    scrollbar-width: none;
}

.vector-tile-settings-dialog .vector-tile-settings-body::-webkit-scrollbar {
    width: 0;
    height: 0;
}

@media (max-height: 720px) {
    .vector-tile-settings-dialog.modal-dialog {
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
        min-height: calc(100% - 1rem);
    }

    .vector-tile-settings-dialog .vector-tile-settings-content {
        max-height: calc(100vh - 1rem);
        max-height: calc(100dvh - 1rem);
    }
}
</style>
