import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import Vue from 'vue'
import * as editor from '../src/utils/vectorTileLegend/editor.js'
import { normalizeVectorTileSpatialContext } from '../src/utils/vectorTileLegend/preview.js'
import { buildFilteredVectorTileUrl, buildLabeledVectorTileUrl } from '../src/utils/vectorTileUrl.js'

const readComponent = path => readFileSync(new URL(`../src/components/${path}`, import.meta.url), 'utf8')
const plain = value => JSON.parse(JSON.stringify(value))
const layer = {
    key: 'layer-1',
    name: 'Macrozonas',
    url: '/vector/tiles/macrozonas',
    sh_map_has_layer_geoserver_layer: 'macrozonas',
}

// Ejecuta el script real del modal sobre Vue 2. Solo se sustituyen componentes
// visuales y transporte HTTP; validación, eventos y reactividad son los reales.
function loadModal(services = {}) {
    const script = readComponent('VectorTileLayerSettingsModal.vue')
        .match(/<script>([\s\S]*?)<\/script>/)[1]
        .replace(/^import [\s\S]*? from ['"][^'"]+['"]\s*$/gm, '')
        .replace('export default', 'return')
    const dependencies = {
        ...editor,
        normalizeVectorTileSpatialContext,
        BModal: {},
        VectorTileSymbologyEditor: {},
        fetchVectorTileAttributes: async () => ({ attributes: ['macrozona', 'codigo'] }),
        fetchVectorTileSemanticLegend: async () => ({ geometry_type: 'MultiPolygon' }),
        ...services,
    }
    return new Function(...Object.keys(dependencies), script)(...Object.values(dependencies))
}

function method(path, name, dependencies = {}) {
    const source = readComponent(path)
    const declaration = source.match(new RegExp(`        ((?:async )?${name}\\([^]*?\\n        }),?`))?.[1]
    assert.ok(declaration, `No se encontró ${path}:${name}`)
    return new Function(...Object.keys(dependencies), `return ${declaration.startsWith('async ') ? 'async function ' + declaration.slice(6) : 'function ' + declaration}`)(...Object.values(dependencies))
}

async function modal(t, services, configuredLayer = layer) {
    const vm = new Vue({ ...loadModal(services), propsData: { layer: configuredLayer, visible: true } })
    t.after(() => vm.$destroy())
    await vm.initialize()
    vm.activeTab = 'filters'
    await Vue.nextTick()
    const events = []
    vm.$on('apply', settings => events.push(plain(settings)))
    vm.$on('update:visible', visible => events.push({ visible }))
    return { vm, events }
}

test('aplica macrozona sin exigir atributo ni clases de simbología (regresión de la captura)', async t => {
    const { vm, events } = await modal(t)
    assert.ok(vm.validateState().some(error => error.includes('simbología temática')))
    vm.filterAttribute = 'macrozona'
    vm.filterValue = 'TALCA NORORIENTE'
    vm.applyAndClose()
    assert.deepEqual(plain(vm.validationErrors), [])
    assert.deepEqual(events, [{
        layerKey: layer.key, opacity: 1,
        filterAttribute: 'macrozona', filterValue: 'TALCA NORORIENTE',
    }, { visible: false }])
    assert.equal(vm.canCopy, false, 'Copiar JSON sigue exigiendo una leyenda válida')
})

test('permite solo transparencia sin depender de la geometría del servicio de leyenda', async t => {
    const { vm, events } = await modal(t, {
        fetchVectorTileSemanticLegend: async () => { throw new Error('Sin servicio de leyenda') },
    })
    assert.equal(vm.geometryResolved, false)
    assert.equal(vm.shouldApplyLegend, false)
    vm.opacity = 0
    vm.applyAndClose()
    assert.equal(events[0].opacity, 0)
    assert.equal(Object.hasOwn(events[0], 'legendConfig'), false)
    assert.deepEqual(plain(vm.validationErrors), [])
})

test('editar simbología y cambiar a filtros no permite omitir sus errores', async t => {
    const { vm, events } = await modal(t)
    vm.updateLegendDraft({ ...vm.draft, title: '' })
    vm.applyAndClose()
    await Vue.nextTick()
    assert.equal(events.length, 0)
    assert.equal(vm.activeTab, 'symbology')
    assert.ok(vm.validationErrors.includes('El título de la leyenda es obligatorio.'))
})

test('seleccionar un atributo temático vacío se considera una edición explícita', async t => {
    const { vm, events } = await modal(t)
    await vm.selectLegendAttribute('')
    vm.applyAndClose()
    assert.equal(vm.symbologyEdited, true)
    assert.equal(events.length, 0)
})

test('aplica cambios válidos de simbología y filtro juntos desde la segunda pestaña', async t => {
    const { vm, events } = await modal(t)
    vm.updateLegendDraft({ ...vm.draft, mode: 'simple' })
    vm.filterAttribute = 'codigo'
    vm.filterValue = '0'
    vm.save()
    assert.equal(events[0].filterValue, '0')
    assert.ok(JSON.parse(events[0].legendConfig).vector_tile_legend)
})

test('la primera pestaña conserva la validación completa aunque no se haya editado', async t => {
    const { vm, events } = await modal(t)
    vm.activeTab = 'symbology'
    vm.save()
    assert.ok(vm.validationErrors.length > 0)
    assert.deepEqual(events, [])
})

test('cancelar y reabrir descarta ediciones y reinicia su seguimiento', async t => {
    const { vm, events } = await modal(t)
    vm.updateLegendDraft({ ...vm.draft, title: 'Cambio descartado' })
    vm.visibleProxy = false
    assert.deepEqual(events, [{ visible: false }], 'Cancelar no emite apply')
    await vm.initialize()
    assert.equal(vm.symbologyEdited, false)
    assert.equal(vm.draft.title, 'Macrozonas')
    assert.equal(vm.activeTab, 'symbology')
})

test('restaura filtros y transparencia existentes sin convertir la carga temática en edición', async t => {
    const draft = editor.applySemanticLegendToDraft({ ...editor.createVectorTileLegendDraft(layer), attribute: 'codigo' }, {
        geometry_type: 'MultiPolygon', legend_type: 'categorical',
        classes: [{ key: 'A', label: 'Clase A' }],
    })
    const legendConfig = editor.stringifyVectorTileLegendConfig(draft)
    const { vm, events } = await modal(t, {
        fetchVectorTileSemanticLegend: async ({ attribute }) => ({
            attribute, geometry_type: 'MultiPolygon', legend_type: 'categorical',
            classes: [{ key: 'A', label: 'Clase A' }],
        }),
    }, {
        ...layer, opacity: 0.4, filterAttribute: 'macrozona', filterValue: 'TALCA NORORIENTE',
        sh_map_has_layer_legend_config: legendConfig,
    })
    assert.equal(vm.symbologyEdited, false)
    assert.equal(vm.filterValue, 'TALCA NORORIENTE')
    assert.equal(vm.opacity, 0.4)
    vm.save()
    assert.equal(events[0].filterAttribute, 'macrozona')
    assert.equal(Object.hasOwn(events[0], 'legendConfig'), false)
})

function toolsVm() {
    return new Vue({
        data: () => ({
            layers: [{ id: layer.key, name: layer.name, sh_map_has_layer_legend_config: 'persistida' }],
            active_layers: {}, disabled_layers: {}, active_base_layers: '',
            layer_opacity: {}, layer_filters: {}, runtimeLegendConfigs: {}, legendRevisions: {}, layer_fit_requests: {},
        }),
        computed: {
            working_layers: method('SheetsMapTools.vue', 'working_layers', { _: { isEmpty: value => !value.length } }),
        },
        methods: {
            applyVectorTileSettings: method('SheetsMapTools.vue', 'applyVectorTileSettings'),
            getLayerFilter: method('SheetsMap.vue', 'getLayerFilter'),
            getLayerOpacity: method('SheetsMap.vue', 'getLayerOpacity'),
        },
    })
}

for (const value of ['TALCA NORORIENTE', 'Niñez & O\'Higgins + 50%', '0', 0, false]) {
    test(`propaga el filtro hasta la URL de tiles con igualdad y valor ${JSON.stringify(value)}`, async t => {
        const { vm, events } = await modal(t)
        const tools = toolsVm()
        t.after(() => tools.$destroy())
        tools.$set(tools.runtimeLegendConfigs, layer.key, 'personalizada')
        tools.$set(tools.legendRevisions, layer.key, 4)
        // Se fuerza la lectura previa para verificar que $set invalida el computed.
        assert.equal(tools.working_layers[0].filterAttribute, '')
        vm.filterAttribute = 'macrozona'
        vm.filterValue = value
        vm.opacity = 0.35
        vm.save()
        tools.applyVectorTileSettings(events[0])
        assert.deepEqual(plain(tools.getLayerFilter(layer.key)), { attribute: 'macrozona', value })
        assert.equal(tools.getLayerOpacity(layer.key), 0.35)
        assert.equal(tools.working_layers[0].sh_map_has_layer_legend_config, 'personalizada')
        assert.equal(tools.legendRevisions[layer.key], 4)

        const filter = tools.getLayerFilter(layer.key)
        const tileUrl = '/vector/tiles/macrozonas/{z}/{x}/{y}.pbf?token=existing'
        const rawUrl = method('layers/VectorTileLayer.vue', 'buildRawFilteredTileUrl', {
            buildFilteredVectorTileUrl, buildLabeledVectorTileUrl,
            featureKeyTileUrl: url => url,
        }).call({ tileUrl, filterAttribute: filter.attribute, filterValue: filter.value, hasLabelText: () => false })
        assert.equal(new URL(rawUrl, 'https://example.test').searchParams.get('filter.macrozona'), `eq.${value}`)
        assert.ok(rawUrl.includes('/{z}/{x}/{y}.pbf?token=existing&'))

        const refreshed = []
        const source = { tiles: [tileUrl], setTiles: urls => refreshed.push(urls) }
        await method('layers/VectorTileLayer.vue', 'applyTileFilter').call({
            maplibreMap: { getSource: () => source, isStyleLoaded: () => true },
            legendCountScope: 'scope', isDestroyed: () => false, buildFilteredTileUrl: () => rawUrl,
        })
        assert.deepEqual(refreshed, [[rawUrl]])
    })
}

for (const [attribute, value] of [['', 'valor anterior'], ['macrozona', '']]) {
    test(`limpiar filtro (${JSON.stringify([attribute, value])}) restaura la URL original y conserva leyenda`, async t => {
        const { vm, events } = await modal(t)
        const tools = toolsVm()
        t.after(() => tools.$destroy())
        tools.applyVectorTileSettings({ layerKey: layer.key, opacity: 1, filterAttribute: 'macrozona', filterValue: 'Talca' })
        vm.filterAttribute = attribute
        vm.filterValue = value
        vm.save()
        tools.applyVectorTileSettings(events[0])
        assert.deepEqual(plain(tools.getLayerFilter(layer.key)), { attribute: '', value: '' })
        assert.equal(tools.working_layers[0].sh_map_has_layer_legend_config, 'persistida')
        assert.deepEqual(plain(tools.legendRevisions), {})
        const filter = tools.getLayerFilter(layer.key)
        assert.equal(buildFilteredVectorTileUrl(layer.url, filter.attribute, filter.value), layer.url)
    })
}

test('una edición de leyenda explícita sí actualiza configuración y revisión', t => {
    const tools = toolsVm()
    t.after(() => tools.$destroy())
    tools.applyVectorTileSettings({ layerKey: layer.key, opacity: 1, filterAttribute: '', filterValue: '', legendConfig: 'nueva' })
    assert.equal(tools.working_layers[0].sh_map_has_layer_legend_config, 'nueva')
    assert.equal(tools.legendRevisions[layer.key], 1)
})

test('aplicar o limpiar un filtro no modifica el estado de otra capa', t => {
    const tools = toolsVm()
    t.after(() => tools.$destroy())
    tools.applyVectorTileSettings({ layerKey: 'otra', opacity: 0.7, filterAttribute: 'codigo', filterValue: 'B', legendConfig: 'otra leyenda' })
    tools.applyVectorTileSettings({ layerKey: layer.key, opacity: 0.2, filterAttribute: 'macrozona', filterValue: 'Talca' })
    tools.applyVectorTileSettings({ layerKey: layer.key, opacity: 0.2, filterAttribute: '', filterValue: '' })
    assert.deepEqual(plain(tools.layer_filters.otra), { attribute: 'codigo', value: 'B' })
    assert.equal(tools.layer_opacity.otra, 0.7)
    assert.equal(tools.runtimeLegendConfigs.otra, 'otra leyenda')
    assert.equal(tools.legendRevisions.otra, 1)
})
