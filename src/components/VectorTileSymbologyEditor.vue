<template>
    <div class="symbology-workspace">
        <div class="symbology-editor">
            <section class="editor-card">
                <div class="editor-card__heading">
                    <div>
                        <h5>Definición de simbología</h5>
                <p>Elige cómo clasificar la capa y cómo se identificará en la leyenda.</p>
                    </div>
                </div>
                <div class="form-grid form-grid--two">
                    <label class="field-control">
                        <span>Tipo de simbología</span>
                        <select :value="draft.mode" @change="update('mode', $event.target.value)">
                            <option value="simple">Simple</option>
                            <option value="thematic">Temática</option>
                        </select>
                    </label>
                    <label v-if="draft.mode === 'thematic'" class="field-control">
                        <span>Atributo de clasificación</span>
                        <select :value="draft.attribute" :disabled="loading" @change="$emit('attribute-change', $event.target.value)">
                            <option value="">Seleccionar atributo...</option>
                            <option v-for="attribute in attributes" :key="attribute" :value="attribute">{{ attribute }}</option>
                        </select>
                    </label>
                    <label class="field-control">
                        <span>Título de la leyenda</span>
                        <input :value="draft.title" placeholder="Ej.: Zonas por categoría" @input="update('title', $event.target.value)">
                    </label>
                    <label class="field-control">
                        <span>Descripción</span>
                        <input :value="draft.description" placeholder="Contexto breve para quien consulta el mapa" @input="update('description', $event.target.value)">
                    </label>
                </div>
                <div v-if="error" class="editor-status editor-status--error" role="alert">{{ error }}</div>
            </section>

            <section class="editor-card">
                <div class="editor-card__heading">
                    <div>
                        <h5>Estilo de la geometría</h5>
                <p>Configura colores, transparencias y trazos para {{ geometryDescription }}.</p>
                    </div>
                </div>

                <div v-if="!isLineGeometry" class="control-group">
                    <h6>Relleno</h6>
                    <div class="form-grid form-grid--two">
                        <label class="field-control">
                            <span>Color de relleno</span>
                            <span class="color-control">
                                <input type="color" :value="draft.fallbackColor" aria-label="Color de relleno" @input="update('fallbackColor', $event.target.value)">
                                <code>{{ draft.fallbackColor }}</code>
                            </span>
                        </label>
                        <label class="field-control">
                            <span>Opacidad del relleno</span>
                            <span class="number-control"><input type="number" min="0" max="1" step="0.05" :value="draft.fillOpacity" @input="updateBoundedNumber('fillOpacity', $event)"><small>0 – 1</small></span>
                        </label>
                    </div>
                </div>

                <div v-if="!isLineGeometry" class="control-group">
                    <h6>Borde</h6>
                    <div class="form-grid" :class="isPointGeometry ? 'form-grid--four' : 'form-grid--three'">
                        <label class="field-control">
                            <span>Color del borde</span>
                            <span class="color-control">
                                <input type="color" :value="draft.strokeColor" aria-label="Color del borde" @input="update('strokeColor', $event.target.value)">
                                <code>{{ draft.strokeColor }}</code>
                            </span>
                        </label>
                        <label class="field-control">
                            <span>Opacidad del borde</span>
                            <span class="number-control"><input type="number" min="0" max="1" step="0.05" :value="draft.strokeOpacity" :disabled="!draft.borderEnabled" @input="updateBoundedNumber('strokeOpacity', $event)"><small>0 – 1</small></span>
                        </label>
                        <label class="field-control">
                            <span>Ancho del borde</span>
                            <span class="number-control"><input type="number" min="0" :max="isPointGeometry ? 16 : 20" step="0.5" :value="isPointGeometry ? draft.pointStrokeWidth : draft.strokeWidth" :disabled="!draft.borderEnabled || Boolean(draft.pointImage)" @input="updateBoundedNumber(isPointGeometry ? 'pointStrokeWidth' : 'strokeWidth', $event)"><small>px</small></span>
                        </label>
                        <label v-if="isPointGeometry" class="field-control">
                            <span>Tipo de borde</span>
                            <select :value="draft.dashStyle" :disabled="!draft.borderEnabled || Boolean(draft.pointImage)" @change="update('dashStyle', $event.target.value)">
                                <option v-for="option in dashOptions" :key="option.value" :value="option.value">{{ option.symbol }}&nbsp;&nbsp;{{ option.label }}</option>
                            </select>
                        </label>
                    </div>
                    <div class="toggle-row">
                        <label class="toggle-control">
                            <input type="checkbox" :checked="draft.borderEnabled" @change="update('borderEnabled', $event.target.checked)">
                            <span><strong>Mostrar borde</strong><small>Delimita visualmente cada geometría.</small></span>
                        </label>
                    </div>
                </div>

                <div v-if="isPointGeometry" class="control-group">
                    <h6>Marcador</h6>
                    <p v-if="draft.pointImage" class="editor-notice" role="note">
                        Esta capa usa un ícono configurado. El ícono tiene prioridad y las formas geométricas no se aplicarán.
                    </p>
                    <div class="form-grid form-grid--two">
                        <label class="field-control">
                            <span>Forma</span>
                            <select :value="draft.pointShape" :disabled="Boolean(draft.pointImage)" @change="update('pointShape', $event.target.value)">
                                <option v-for="option in pointShapeOptions" :key="option.value" :value="option.value">{{ option.symbol }}&nbsp;&nbsp;{{ option.label }}</option>
                            </select>
                        </label>
                        <label class="field-control">
                            <span>Tamaño</span>
                            <span class="number-control"><input type="number" min="1" max="64" :value="draft.pointSize" :disabled="Boolean(draft.pointImage)" @input="updateBoundedNumber('pointSize', $event)"><small>px</small></span>
                        </label>
                    </div>
                </div>

                <div v-if="isLineGeometry || isPolygonGeometry" class="control-group">
                    <h6>{{ isPolygonGeometry ? 'Línea del borde' : 'Línea' }}</h6>
                    <div v-if="isLineGeometry" class="form-grid form-grid--three">
                        <label class="field-control">
                            <span>Color de línea</span>
                            <span class="color-control">
                                <input type="color" :value="draft.fallbackColor" aria-label="Color de línea" @input="update('fallbackColor', $event.target.value)">
                                <code>{{ draft.fallbackColor }}</code>
                            </span>
                        </label>
                        <label class="field-control">
                            <span>Opacidad de línea</span>
                            <span class="number-control"><input type="number" min="0" max="1" step="0.05" :value="draft.lineOpacity" @input="updateBoundedNumber('lineOpacity', $event)"><small>0 – 1</small></span>
                        </label>
                        <label class="field-control">
                            <span>Ancho de línea</span>
                            <span class="number-control"><input type="number" min="0" max="20" step="0.5" :value="draft.lineWidth" @input="updateBoundedNumber('lineWidth', $event)"><small>px</small></span>
                        </label>
                    </div>
                    <div class="field-control field-control--full">
                        <span>Tipo de línea</span>
                        <div class="dash-style-picker" role="radiogroup" aria-label="Tipo de línea">
                            <button
                                v-for="option in dashOptions"
                                :key="option.value"
                                type="button"
                                class="dash-option"
                                :class="{ 'dash-option--active': draft.dashStyle === option.value }"
                                role="radio"
                                :aria-checked="String(draft.dashStyle === option.value)"
                                @click="update('dashStyle', option.value)"
                            >
                                <i class="dash-option__sample" :class="`dash-option__sample--${option.value}`"></i>
                                <span>{{ option.label }}</span>
                            </button>
                        </div>
                    </div>
                </div>

            </section>

            <section class="editor-card">
                <div class="editor-card__heading">
                    <div><h5>Leyenda</h5><p>Controla qué información se presenta a quienes consultan el mapa.</p></div>
                </div>
                <div class="form-grid form-grid--two">
                    <label class="field-control">
                        <span>Color sin clasificación</span>
                        <span class="color-control">
                            <input type="color" :value="draft.nullColor" aria-label="Color sin clasificación" :disabled="!draft.showUnclassified" @input="update('nullColor', $event.target.value)">
                            <code>{{ draft.nullColor }}</code>
                        </span>
                    </label>
                </div>
                <div class="toggle-row toggle-row--two">
                    <label class="toggle-control">
                        <input type="checkbox" :checked="draft.showInMapLegend" @change="update('showInMapLegend', $event.target.checked)">
                        <span><strong>Mostrar en el mapa</strong><small>Publica esta leyenda en el visor.</small></span>
                    </label>
                    <label class="toggle-control">
                        <input type="checkbox" :checked="draft.showUnclassified" @change="update('showUnclassified', $event.target.checked)">
                        <span><strong>Mostrar sin clasificación</strong><small>Incluye elementos sin valor asignado.</small></span>
                    </label>
                </div>
            </section>

            <section v-if="draft.mode === 'thematic' && draft.items.length" class="editor-card editor-card--classes">
                <div class="editor-card__heading">
                    <div><h5>Clases</h5><p>Personaliza cada clase. Sus valores tienen prioridad sobre el estilo general.</p></div>
                    <span class="class-count">{{ draft.items.length }} clases</span>
                </div>
                <div class="class-list">
                    <article v-for="(item, index) in draft.items" :key="item.key" class="class-row">
                        <header class="class-row__header">
                            <div><span>Clase {{ index + 1 }}</span><strong :title="rangeLabel(item)">{{ rangeLabel(item) }}</strong></div>
                            <small v-if="item.count !== null && item.count !== undefined">{{ item.count }} elementos</small>
                        </header>
                        <div class="class-settings-grid">
                            <label class="field-control"><span>Etiqueta</span><input aria-label="Nombre de clase" :value="item.label" @input="updateItem(index, 'label', $event.target.value)"></label>
                            <label v-if="isNumericLegend" class="field-control"><span>Mínimo</span><input aria-label="Mínimo" type="number" :value="item.minValue" @input="updateItem(index, 'minValue', optionalNumber($event.target.value))"></label>
                            <label v-if="isNumericLegend" class="field-control"><span>Máximo</span><input aria-label="Máximo" type="number" :value="item.maxValue" @input="updateItem(index, 'maxValue', optionalNumber($event.target.value))"></label>

                            <label class="field-control"><span>{{ isLineGeometry ? 'Color de línea' : 'Color principal' }}</span><span class="color-control"><input aria-label="Color de clase" type="color" :value="item.fill" @input="updateItem(index, 'fill', $event.target.value)"><code>{{ item.fill }}</code></span></label>
                            <label v-if="!isLineGeometry" class="field-control"><span>Opacidad del relleno</span><span class="number-control"><input aria-label="Opacidad del relleno de clase" type="number" min="0" max="1" step="0.05" :value="itemStyleValue(item, 'fillOpacity')" @input="updateBoundedItemStyle(index, 'fillOpacity', $event)"><small>0 – 1</small></span></label>
                            <label v-if="!isLineGeometry" class="field-control"><span>Color del borde</span><span class="color-control"><input aria-label="Color de borde" type="color" :value="item.stroke" @input="updateItem(index, 'stroke', $event.target.value)"><code>{{ item.stroke }}</code></span></label>

                            <label v-if="isPolygonGeometry" class="field-control"><span>Ancho del borde</span><span class="number-control"><input aria-label="Ancho del borde de clase" type="number" min="0" max="20" step="0.5" :disabled="!itemStyleValue(item, 'borderEnabled')" :value="itemStyleValue(item, 'strokeWidth')" @input="updateBoundedItemStyle(index, 'strokeWidth', $event)"><small>px</small></span></label>
                            <label v-if="!isLineGeometry" class="field-control"><span>Opacidad del borde</span><span class="number-control"><input aria-label="Opacidad del borde de clase" type="number" min="0" max="1" step="0.05" :disabled="!itemStyleValue(item, 'borderEnabled')" :value="itemStyleValue(item, 'strokeOpacity')" @input="updateBoundedItemStyle(index, 'strokeOpacity', $event)"><small>0 – 1</small></span></label>

                            <label v-if="isLineGeometry" class="field-control"><span>Ancho de línea</span><span class="number-control"><input aria-label="Ancho de línea de clase" type="number" min="0" max="20" step="0.5" :value="itemStyleValue(item, 'lineWidth')" @input="updateBoundedItemStyle(index, 'lineWidth', $event)"><small>px</small></span></label>
                            <label v-if="isLineGeometry" class="field-control"><span>Opacidad de línea</span><span class="number-control"><input aria-label="Opacidad de línea de clase" type="number" min="0" max="1" step="0.05" :value="itemStyleValue(item, 'lineOpacity')" @input="updateBoundedItemStyle(index, 'lineOpacity', $event)"><small>0 – 1</small></span></label>
                            <label v-if="isLineGeometry || isPolygonGeometry || isPointGeometry" class="field-control"><span>{{ isPointGeometry ? 'Tipo de borde' : 'Tipo de línea' }}</span><select :aria-label="isPointGeometry ? 'Tipo de borde de clase' : 'Tipo de línea de clase'" :value="itemStyleValue(item, 'dashStyle')" :disabled="isPointGeometry && (Boolean(draft.pointImage) || !itemStyleValue(item, 'borderEnabled'))" @change="updateItemStyle(index, 'dashStyle', $event.target.value)"><option v-for="option in dashOptions" :key="option.value" :value="option.value">{{ option.symbol }}&nbsp;&nbsp;{{ option.label }}</option></select></label>

                            <label v-if="isPointGeometry" class="field-control"><span>Forma</span><select aria-label="Forma del punto" :value="itemPointValue(item, 'shape')" :disabled="Boolean(draft.pointImage)" @change="updateItemPoint(index, 'shape', $event.target.value)"><option v-for="option in pointShapeOptions" :key="option.value" :value="option.value">{{ option.symbol }}&nbsp;&nbsp;{{ option.label }}</option></select></label>
                            <label v-if="isPointGeometry" class="field-control"><span>Tamaño</span><span class="number-control"><input aria-label="Tamaño del punto" type="number" min="1" max="64" :value="itemPointValue(item, 'size')" :disabled="Boolean(draft.pointImage)" @input="updateBoundedItemPoint(index, 'size', 'pointSize', $event)"><small>px</small></span></label>
                            <label v-if="isPointGeometry" class="field-control"><span>Ancho de borde</span><span class="number-control"><input aria-label="Ancho del borde del punto" type="number" min="0" max="16" :value="itemPointValue(item, 'strokeWidth')" :disabled="Boolean(draft.pointImage) || !itemStyleValue(item, 'borderEnabled')" @input="updateBoundedItemPoint(index, 'strokeWidth', 'pointStrokeWidth', $event)"><small>px</small></span></label>
                        </div>
                        <label v-if="!isLineGeometry" class="toggle-control class-row__toggle"><input type="checkbox" :checked="itemStyleValue(item, 'borderEnabled')" @change="updateItemStyle(index, 'borderEnabled', $event.target.checked)"><span><strong>Mostrar borde</strong><small>Esta clase sobrescribe la configuración general.</small></span></label>
                    </article>
                </div>
            </section>
        </div>

        <vector-tile-symbology-preview
            :draft="draft"
            :layer="layer"
            :semantic-legend="semanticLegend"
            :spatial-context="spatialContext"
        />
    </div>
</template>

<script>
import VectorTileSymbologyPreview from './VectorTileSymbologyPreview.vue'
import { applyGlobalVectorTileStyleUpdate, normalizeVectorTileStyleValue } from '../utils/vectorTileLegend/editor.js'

export default {
    name: 'VectorTileSymbologyEditor',
    components: { VectorTileSymbologyPreview },
    props: {
        draft: { type: Object, required: true },
        attributes: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        error: { type: String, default: '' },
        layer: { type: Object, required: true },
        semanticLegend: { type: Object, default: null },
        spatialContext: { type: Object, default: () => ({ bbox: null, centroid: null }) },
    },
    data() {
        return {
            dashOptions: [
                { value: 'solid', label: 'Continua', symbol: '━' },
                { value: 'dashed', label: 'Segmentada', symbol: '┄' },
                { value: 'dotted', label: 'Punteada', symbol: '···' },
            ],
            pointShapeOptions: [
                { value: 'circle', label: 'Círculo', symbol: '●' },
                { value: 'square', label: 'Cuadrado', symbol: '■' },
                { value: 'triangle', label: 'Triángulo', symbol: '▲' },
                { value: 'diamond', label: 'Rombo', symbol: '◆' },
            ],
        }
    },
    computed: {
        geometryType() { return String(this.draft.geometryType || '').toLowerCase() },
        isPointGeometry() { return this.geometryType.includes('point') },
        isLineGeometry() { return this.geometryType.includes('line') },
        isPolygonGeometry() { return this.geometryType.includes('polygon') },
        isNumericLegend() { return ['numeric', 'numerical'].includes(String(this.draft.legendType || '').toLowerCase()) },
        geometryDescription() {
            if (this.isPolygonGeometry) return 'polígonos'
            if (this.isLineGeometry) return 'líneas'
            if (this.isPointGeometry) return 'puntos'
            return 'la capa'
        },
    },
    methods: {
        emitDraft(next) { this.$emit('update:draft', next) },
        update(key, value) {
            this.emitDraft(applyGlobalVectorTileStyleUpdate(this.draft, key, value))
        },
        updateBoundedNumber(key, event) {
            const rawValue = event.target.value
            if (rawValue === '' || !Number.isFinite(Number(rawValue))) return
            const normalized = normalizeVectorTileStyleValue(key, rawValue, this.draft[key])
            if (normalized !== Number(rawValue)) event.target.value = String(normalized)
            this.update(key, normalized)
        },
        optionalNumber(value) { return value === '' ? null : Number(value) },
        updateItem(index, key, value) {
            const items = this.draft.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)
            this.emitDraft({ ...this.draft, items })
        },
        itemStyleValue(item, key) {
            return item.style?.[key] ?? this.draft[key]
        },
        updateItemStyle(index, key, value) {
            const items = this.draft.items.map((item, itemIndex) => itemIndex === index
                ? { ...item, style: { ...item.style, [key]: value } }
                : item)
            this.emitDraft({ ...this.draft, items })
        },
        updateBoundedItemStyle(index, key, event) {
            const rawValue = event.target.value
            if (rawValue === '' || !Number.isFinite(Number(rawValue))) return
            const normalized = normalizeVectorTileStyleValue(key, rawValue, this.itemStyleValue(this.draft.items[index], key))
            if (normalized !== Number(rawValue)) event.target.value = String(normalized)
            this.updateItemStyle(index, key, normalized)
        },
        itemPointValue(item, key) {
            const globalKey = key === 'shape' ? 'pointShape' : (key === 'size' ? 'pointSize' : 'pointStrokeWidth')
            return item.point?.[key] ?? this.draft[globalKey]
        },
        updateItemPoint(index, key, value) {
            const item = this.draft.items[index]
            const items = this.draft.items.map((candidate, itemIndex) => itemIndex === index
                ? { ...candidate, point: { ...item.point, [key]: value } }
                : candidate)
            this.emitDraft({ ...this.draft, items })
        },
        updateBoundedItemPoint(index, key, styleKey, event) {
            const rawValue = event.target.value
            if (rawValue === '' || !Number.isFinite(Number(rawValue))) return
            const currentValue = this.itemPointValue(this.draft.items[index], key)
            const normalized = normalizeVectorTileStyleValue(styleKey, rawValue, currentValue)
            if (normalized !== Number(rawValue)) event.target.value = String(normalized)
            this.updateItemPoint(index, key, normalized)
        },
        rangeLabel(item) {
            if (Number.isFinite(item.minValue) || Number.isFinite(item.maxValue)) return `${item.minValue} – ${item.maxValue}`
            return item.key
        },
    },
}
</script>

<style scoped>
.symbology-workspace { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 20px; align-items: start; }
.symbology-editor { display: flex; min-width: 0; flex-direction: column; gap: 16px; }
.editor-card { padding: 20px; border: 1px solid #dbe3ea; border-radius: 10px; background: #fff; }
.editor-card__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.editor-card__heading h5 { margin: 0; color: #263746; font-size: 1rem; font-weight: 700; }
.editor-card__heading p { margin: 4px 0 0; color: #677786; font-size: .78rem; line-height: 1.45; }
.form-grid { display: grid; gap: 16px; }
.form-grid--two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.form-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.form-grid--four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.field-control { display: flex; min-width: 0; flex-direction: column; gap: 7px; color: #344554; font-size: .78rem; font-weight: 700; }
.field-control--disabled { color: #82909d; }
.field-control--full { margin-top: 16px; }
input, select { box-sizing: border-box; width: 100%; min-height: 40px; border: 1px solid #cbd6df; border-radius: 6px; padding: 7px 12px; color: #263746; background-color: #fff; font-size: .875rem; font-weight: 400; outline: none; transition: border-color .15s, box-shadow .15s; }
select { appearance: none; padding-right: 38px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20'%3E%3Cpath fill='none' stroke='%23344554' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m5 7.5 5 5 5-5'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 14px; }
select:disabled { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20'%3E%3Cpath fill='none' stroke='%2382909d' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m5 7.5 5 5 5-5'/%3E%3C/svg%3E"); }
select option { color: #263746; background: #fff; font-size: .875rem; }
input:focus, select:focus, button:focus-visible { border-color: #3b82c4; box-shadow: 0 0 0 3px rgba(59, 130, 196, .16); }
input:disabled, select:disabled { color: #82909d; background-color: #eef2f5; cursor: not-allowed; }
.color-control, .number-control { display: flex; align-items: stretch; min-width: 0; }
.color-control { gap: 8px; }
.color-control input[type="color"] { width: 52px; min-width: 52px; height: 40px; padding: 3px; cursor: pointer; }
.color-control code { display: flex; min-width: 0; flex: 1; align-items: center; padding: 0 12px; border: 1px solid #d8e0e7; border-radius: 6px; color: #536472; background: #f7f9fb; font-family: inherit; font-size: .875rem; font-weight: 400; text-transform: uppercase; }
.number-control input { border-radius: 6px 0 0 6px; }
.number-control small { display: flex; min-width: 50px; align-items: center; justify-content: center; padding: 0 8px; border: 1px solid #cbd6df; border-left: 0; border-radius: 0 6px 6px 0; color: #687887; background: #f5f7f9; font-size: .75rem; font-weight: 600; white-space: nowrap; }
.control-group + .control-group { margin-top: 22px; padding-top: 20px; border-top: 1px solid #e4eaf0; }
.control-group h6 { margin: 0 0 14px; color: #4c5d6c; font-size: .77rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.toggle-row { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #edf1f4; }
.toggle-row--two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.toggle-control { display: flex; align-items: flex-start; gap: 10px; padding: 11px 12px; border: 1px solid #dbe3ea; border-radius: 8px; background: #fafbfd; cursor: pointer; }
.toggle-control input { width: 16px; min-width: 16px; min-height: 16px; margin-top: 2px; accent-color: #1473c9; }
.toggle-control span { display: flex; flex-direction: column; gap: 2px; }
.toggle-control strong { color: #344554; font-size: .78rem; }
.toggle-control small { color: #748391; font-size: .7rem; font-weight: 400; line-height: 1.35; }
.dash-style-picker { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
.dash-option { display: flex; min-height: 42px; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid #cbd6df; border-radius: 7px; color: #3c4d5c; background: #fff; cursor: pointer; }
.dash-option:hover { border-color: #8db6da; background: #f6faff; }
.dash-option--active { border-color: #1473c9; color: #0b5cad; background: #edf6ff; box-shadow: inset 0 0 0 1px #1473c9; }
.dash-option__sample { display: block; width: 44px; height: 4px; flex: 0 0 44px; border-radius: 2px; background: #34495e; }
.dash-option__sample--dashed { background: repeating-linear-gradient(90deg, #34495e 0 10px, transparent 10px 16px); }
.dash-option__sample--dotted { background: repeating-linear-gradient(90deg, #34495e 0 3px, transparent 3px 9px); }
.editor-status, .editor-notice { margin-top: 14px; padding: 10px 12px; border-radius: 7px; font-size: .76rem; }
.editor-status { color: #0b5cad; background: #edf6ff; }
.editor-status--error { color: #842029; background: #f8d7da; }
.editor-notice { margin: 0 0 16px; color: #664d03; background: #fff3cd; }
.class-count { flex: 0 0 auto; padding: 5px 9px; border-radius: 999px; color: #536472; background: #eef2f5; font-size: .7rem; font-weight: 700; }
.class-list { display: flex; flex-direction: column; gap: 14px; }
.class-row { padding: 16px; border: 1px solid #dfe7ee; border-radius: 9px; background: #fbfcfd; }
.class-row__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #e7edf2; }
.class-row__header div { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.class-row__header span { color: #6f7f8d; font-size: .68rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.class-row__header strong { overflow: hidden; color: #263746; font-size: .85rem; text-overflow: ellipsis; white-space: nowrap; }
.class-row__header small { flex: 0 0 auto; color: #70808e; font-size: .7rem; }
.class-settings-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.class-row__toggle { margin-top: 14px; }
@media (max-width: 1050px) { .symbology-workspace { grid-template-columns: 1fr; } }
@media (max-width: 760px) {
    .editor-card { padding: 16px; }
    .form-grid--two, .form-grid--three, .form-grid--four, .toggle-row--two, .dash-style-picker { grid-template-columns: 1fr; }
    .class-settings-grid { grid-template-columns: 1fr; }
}
</style>
