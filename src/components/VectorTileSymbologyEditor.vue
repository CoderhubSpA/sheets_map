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

            <section v-if="!hasSelectedAttribute" class="editor-card editor-card--general-style">
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

            <section v-if="hasSelectedAttribute" class="editor-card editor-card--classes" :aria-busy="String(loading)">
                <div class="editor-card__heading">
                    <div><h5>Estilo de la geometría</h5><p>Configura colores, transparencias y trazos para las clases de {{ geometryDescription }}.</p></div>
                    <span v-if="draft.items.length" class="class-count">{{ draft.items.length }} clases</span>
                </div>

                <template v-if="draft.items.length">
                <div class="class-section-heading">
                    <h6>Clases</h6>
                    <p>Personaliza la simbología de cada valor del atributo seleccionado.</p>
                </div>

                <div class="class-tabs-shell">
                    <button
                        type="button"
                        class="class-tabs__navigation"
                        :disabled="activeClassIndex === 0"
                        aria-label="Clase anterior"
                        @click="moveClass(-1)"
                    >
                        <svg class="class-tabs__navigation-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                            <path d="m12.5 4.5-5 5.5 5 5.5" />
                        </svg>
                    </button>
                    <div ref="classTabs" class="class-tabs" role="tablist" aria-label="Clases de simbología">
                        <button
                            v-for="(item, index) in draft.items"
                            :key="item.key"
                            :ref="`classTab-${index}`"
                            type="button"
                            class="class-tab"
                            :class="{ 'class-tab--active': activeClassIndex === index }"
                            role="tab"
                            :aria-selected="String(activeClassIndex === index)"
                            :aria-controls="`class-panel-${index}`"
                            :tabindex="activeClassIndex === index ? 0 : -1"
                            @click="selectClass(index)"
                        >
                            <span class="class-tab__swatch" :style="{ backgroundColor: item.fill }" aria-hidden="true"></span>
                            <span class="class-tab__text"><strong>Clase {{ index + 1 }}</strong><small>{{ item.label || rangeLabel(item) }}</small></span>
                        </button>
                    </div>
                    <button
                        type="button"
                        class="class-tabs__navigation"
                        :disabled="activeClassIndex >= draft.items.length - 1"
                        aria-label="Clase siguiente"
                        @click="moveClass(1)"
                    >
                        <svg class="class-tabs__navigation-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                            <path d="m7.5 4.5 5 5.5-5 5.5" />
                        </svg>
                    </button>
                </div>

                <div class="class-list">
                    <article
                        v-if="activeClass"
                        :id="`class-panel-${activeClassIndex}`"
                        :key="activeClass.key"
                        class="class-row"
                        role="tabpanel"
                    >
                        <header class="class-row__header">
                            <div><span>Clase {{ activeClassIndex + 1 }}</span><strong :title="rangeLabel(activeClass)">{{ rangeLabel(activeClass) }}</strong></div>
                            <small v-if="activeClass.count !== null && activeClass.count !== undefined">{{ activeClass.count }} elementos</small>
                        </header>
                        <div class="class-settings-grid class-settings-grid--label">
                            <label class="field-control"><span>Etiqueta</span><input aria-label="Nombre de clase" :value="activeClass.label" @input="updateItem(activeClassIndex, 'label', $event.target.value)"></label>
                        </div>
                        <div v-if="isNumericLegend" class="class-settings-grid class-settings-grid--two class-range-grid">
                            <label class="field-control"><span>Mínimo</span><input aria-label="Mínimo" type="number" :value="activeClass.minValue" @input="updateItem(activeClassIndex, 'minValue', optionalNumber($event.target.value))"></label>
                            <label class="field-control"><span>Máximo</span><input aria-label="Máximo" type="number" :value="activeClass.maxValue" @input="updateItem(activeClassIndex, 'maxValue', optionalNumber($event.target.value))"></label>
                        </div>

                        <div v-if="!isLineGeometry" class="class-control-group">
                            <h6>Relleno</h6>
                            <div class="class-settings-grid class-settings-grid--two">
                                <label class="field-control"><span>Color de relleno</span><span class="color-control"><input aria-label="Color de clase" type="color" :value="activeClass.fill" @input="updateItem(activeClassIndex, 'fill', $event.target.value)"><code>{{ activeClass.fill }}</code></span></label>
                                <label class="field-control"><span>Opacidad del relleno</span><span class="number-control"><input aria-label="Opacidad del relleno de clase" type="number" min="0" max="1" step="0.05" :value="itemStyleValue(activeClass, 'fillOpacity')" @input="updateBoundedItemStyle(activeClassIndex, 'fillOpacity', $event)"><small>0 – 1</small></span></label>
                            </div>
                        </div>

                        <div v-if="!isLineGeometry" class="class-control-group">
                            <h6>Borde</h6>
                            <div class="class-settings-grid class-settings-grid--three">
                                <label class="field-control"><span>Color del borde</span><span class="color-control"><input aria-label="Color de borde" type="color" :value="activeClass.stroke" @input="updateItem(activeClassIndex, 'stroke', $event.target.value)"><code>{{ activeClass.stroke }}</code></span></label>
                                <label class="field-control"><span>Opacidad del borde</span><span class="number-control"><input aria-label="Opacidad del borde de clase" type="number" min="0" max="1" step="0.05" :disabled="!itemStyleValue(activeClass, 'borderEnabled')" :value="itemStyleValue(activeClass, 'strokeOpacity')" @input="updateBoundedItemStyle(activeClassIndex, 'strokeOpacity', $event)"><small>0 – 1</small></span></label>
                                <label class="field-control"><span>Ancho del borde</span><span class="number-control"><input aria-label="Ancho del borde de clase" type="number" min="0" :max="isPointGeometry ? 16 : 20" step="0.5" :disabled="!itemStyleValue(activeClass, 'borderEnabled') || (isPointGeometry && Boolean(draft.pointImage))" :value="isPointGeometry ? itemPointValue(activeClass, 'strokeWidth') : itemStyleValue(activeClass, 'strokeWidth')" @input="isPointGeometry ? updateBoundedItemPoint(activeClassIndex, 'strokeWidth', 'pointStrokeWidth', $event) : updateBoundedItemStyle(activeClassIndex, 'strokeWidth', $event)"><small>px</small></span></label>
                                <label v-if="isPointGeometry" class="field-control"><span>Tipo de borde</span><select aria-label="Tipo de borde de clase" :value="itemStyleValue(activeClass, 'dashStyle')" :disabled="Boolean(draft.pointImage) || !itemStyleValue(activeClass, 'borderEnabled')" @change="updateItemStyle(activeClassIndex, 'dashStyle', $event.target.value)"><option v-for="option in dashOptions" :key="option.value" :value="option.value">{{ option.symbol }}&nbsp;&nbsp;{{ option.label }}</option></select></label>
                            </div>
                            <label class="toggle-control class-row__toggle"><input type="checkbox" :checked="itemStyleValue(activeClass, 'borderEnabled')" @change="updateItemStyle(activeClassIndex, 'borderEnabled', $event.target.checked)"><span><strong>Mostrar borde</strong><small>Esta configuración se aplica únicamente a la clase activa.</small></span></label>
                        </div>

                        <div v-if="isPointGeometry" class="class-control-group">
                            <h6>Marcador</h6>
                            <div class="class-settings-grid class-settings-grid--two">
                                <label class="field-control"><span>Forma</span><select aria-label="Forma del punto" :value="itemPointValue(activeClass, 'shape')" :disabled="Boolean(draft.pointImage)" @change="updateItemPoint(activeClassIndex, 'shape', $event.target.value)"><option v-for="option in pointShapeOptions" :key="option.value" :value="option.value">{{ option.symbol }}&nbsp;&nbsp;{{ option.label }}</option></select></label>
                                <label class="field-control"><span>Tamaño</span><span class="number-control"><input aria-label="Tamaño del punto" type="number" min="1" max="64" :value="itemPointValue(activeClass, 'size')" :disabled="Boolean(draft.pointImage)" @input="updateBoundedItemPoint(activeClassIndex, 'size', 'pointSize', $event)"><small>px</small></span></label>
                            </div>
                        </div>

                        <div v-if="isPolygonGeometry" class="class-control-group">
                            <h6>Línea del borde</h6>
                            <div class="class-settings-grid">
                                <label class="field-control"><span>Tipo de línea</span><select aria-label="Tipo de línea de clase" :value="itemStyleValue(activeClass, 'dashStyle')" :disabled="!itemStyleValue(activeClass, 'borderEnabled')" @change="updateItemStyle(activeClassIndex, 'dashStyle', $event.target.value)"><option v-for="option in dashOptions" :key="option.value" :value="option.value">{{ option.symbol }}&nbsp;&nbsp;{{ option.label }}</option></select></label>
                            </div>
                        </div>

                        <div v-if="isLineGeometry" class="class-control-group">
                            <h6>Línea</h6>
                            <div class="class-settings-grid class-settings-grid--three">
                                <label class="field-control"><span>Color de línea</span><span class="color-control"><input aria-label="Color de clase" type="color" :value="activeClass.fill" @input="updateItem(activeClassIndex, 'fill', $event.target.value)"><code>{{ activeClass.fill }}</code></span></label>
                                <label class="field-control"><span>Opacidad de línea</span><span class="number-control"><input aria-label="Opacidad de línea de clase" type="number" min="0" max="1" step="0.05" :value="itemStyleValue(activeClass, 'lineOpacity')" @input="updateBoundedItemStyle(activeClassIndex, 'lineOpacity', $event)"><small>0 – 1</small></span></label>
                                <label class="field-control"><span>Ancho de línea</span><span class="number-control"><input aria-label="Ancho de línea de clase" type="number" min="0" max="20" step="0.5" :value="itemStyleValue(activeClass, 'lineWidth')" @input="updateBoundedItemStyle(activeClassIndex, 'lineWidth', $event)"><small>px</small></span></label>
                                <label class="field-control"><span>Tipo de línea</span><select aria-label="Tipo de línea de clase" :value="itemStyleValue(activeClass, 'dashStyle')" @change="updateItemStyle(activeClassIndex, 'dashStyle', $event.target.value)"><option v-for="option in dashOptions" :key="option.value" :value="option.value">{{ option.symbol }}&nbsp;&nbsp;{{ option.label }}</option></select></label>
                            </div>
                        </div>
                    </article>
                </div>
                </template>
                <div v-else-if="loading" class="class-loading-placeholder" aria-hidden="true"></div>
                <div v-else class="class-empty-state" role="status">
                    No hay clases configurables para el atributo seleccionado.
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


        </div>

        <vector-tile-symbology-preview
            :draft="draft"
            :layer="layer"
            :request_auth="request_auth"
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
        request_auth: { type: Object, default: null },
        semanticLegend: { type: Object, default: null },
        spatialContext: { type: Object, default: () => ({ bbox: null, centroid: null }) },
    },
    data() {
        return {
            activeClassIndex: 0,
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
        hasSelectedAttribute() {
            return this.draft.mode === 'thematic' && Boolean(String(this.draft.attribute || '').trim())
        },
        activeClass() {
            return this.draft.items[this.activeClassIndex] || null
        },
        geometryDescription() {
            if (this.isPolygonGeometry) return 'polígonos'
            if (this.isLineGeometry) return 'líneas'
            if (this.isPointGeometry) return 'puntos'
            return 'la capa'
        },
    },
    watch: {
        'draft.attribute'() {
            this.activeClassIndex = 0
            this.$nextTick(this.scrollActiveClassTab)
        },
        'draft.items.length'(length) {
            this.activeClassIndex = Math.max(0, Math.min(this.activeClassIndex, length - 1))
            this.$nextTick(this.scrollActiveClassTab)
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
        selectClass(index) {
            this.activeClassIndex = Math.max(0, Math.min(index, this.draft.items.length - 1))
            this.$nextTick(this.scrollActiveClassTab)
        },
        moveClass(direction) {
            this.selectClass(this.activeClassIndex + direction)
        },
        scrollActiveClassTab() {
            const reference = this.$refs[`classTab-${this.activeClassIndex}`]
            const tab = Array.isArray(reference) ? reference[0] : reference
            if (tab?.scrollIntoView) tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
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
.class-section-heading { margin-bottom: 12px; }
.class-section-heading h6, .class-control-group h6 { margin: 0; color: #4c5d6c; font-size: .77rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.class-section-heading p { margin: 4px 0 0; color: #677786; font-size: .75rem; line-height: 1.4; }
.class-tabs-shell { display: grid; grid-template-columns: 38px minmax(0, 1fr) 38px; align-items: stretch; gap: 8px; margin-bottom: 16px; }
.class-tabs { display: flex; min-width: 0; gap: 8px; overflow-x: auto; scroll-behavior: smooth; scrollbar-width: none; }
.class-tabs::-webkit-scrollbar { display: none; }
.class-tabs__navigation { display: inline-flex; width: 38px; min-height: 48px; align-items: center; justify-content: center; padding: 0; border: 1px solid #cbd6df; border-radius: 8px; color: #7a8792; background: #fff; line-height: 1; cursor: pointer; }
.class-tabs__navigation-icon { display: block; width: 20px; height: 20px; flex: 0 0 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.class-tabs__navigation:hover:not(:disabled), .class-tabs__navigation:focus-visible:not(:disabled) { border-color: #1473c9; color: #0b5cad; background: #edf6ff; }
.class-tabs__navigation:disabled { color: #a6b1ba; background: #f2f4f6; cursor: default; }
.class-tab { display: flex; min-width: 150px; max-width: 210px; min-height: 48px; flex: 0 0 auto; align-items: center; gap: 9px; padding: 8px 11px; border: 1px solid #d5dee6; border-radius: 8px 8px 0 0; color: #526372; background: #f8fafc; text-align: left; cursor: pointer; }
.class-tab:hover { border-color: #91b8da; background: #f3f8fd; }
.class-tab--active { border-color: #1473c9; color: #0b5cad; background: #edf6ff; box-shadow: inset 0 -3px 0 #1473c9; }
.class-tab__swatch { width: 18px; height: 18px; flex: 0 0 18px; border: 2px solid rgba(38, 55, 70, .35); border-radius: 4px; }
.class-tab__text { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.class-tab__text strong, .class-tab__text small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.class-tab__text strong { font-size: .75rem; }
.class-tab__text small { font-size: .68rem; font-weight: 400; }
.class-list { display: flex; flex-direction: column; gap: 14px; }
.class-row { padding: 16px; border: 1px solid #dfe7ee; border-radius: 9px; background: #fbfcfd; }
.class-row__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #e7edf2; }
.class-row__header div { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.class-row__header span { color: #6f7f8d; font-size: .68rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.class-row__header strong { overflow: hidden; color: #263746; font-size: .85rem; text-overflow: ellipsis; white-space: nowrap; }
.class-row__header small { flex: 0 0 auto; color: #70808e; font-size: .7rem; }
.class-settings-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.class-settings-grid--two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.class-settings-grid--label { grid-template-columns: minmax(0, 1fr); margin-bottom: 18px; }
.class-range-grid { margin: -4px 0 18px; }
.class-control-group { padding-top: 16px; border-top: 1px solid #e4eaf0; }
.class-control-group + .class-control-group { margin-top: 18px; }
.class-control-group h6 { margin-bottom: 13px; }
.class-row__toggle { margin-top: 14px; }
.class-loading-placeholder { min-height: 230px; }
.class-empty-state { padding: 18px; border: 1px solid #e2e8ee; border-radius: 9px; color: #687887; background: #f8fafc; font-size: .8rem; }
@media (max-width: 1050px) { .symbology-workspace { grid-template-columns: 1fr; } }
@media (max-width: 760px) {
    .editor-card { padding: 16px; }
    .form-grid--two, .form-grid--three, .form-grid--four, .toggle-row--two, .dash-style-picker { grid-template-columns: 1fr; }
    .class-settings-grid, .class-settings-grid--two { grid-template-columns: 1fr; }
    .class-tab { min-width: 132px; }
}
</style>
