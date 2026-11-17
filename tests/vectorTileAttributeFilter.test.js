import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import Vue from 'vue'

const readComponent = path => readFileSync(new URL(`../src/components/${path}`, import.meta.url), 'utf8')
const plain = value => JSON.parse(JSON.stringify(value))
const layer = {
    key: 'layer-1',
    name: 'Macrozonas',
    url: '/vector/tiles/macrozonas',
    sh_map_has_layer_geoserver_layer: 'macrozonas',
}

function method(path, name, dependencies = {}) {
    const source = readComponent(path)
    const declaration = source.match(new RegExp(`        ((?:async )?${name}\\([^]*?\\n        }),?`))?.[1]
    assert.ok(declaration, `No se encontr¢ ${path}:${name}`)
    return new Function(...Object.keys(dependencies), `return ${declaration.startsWith('async ') ? 'async function ' + declaration.slice(6) : 'function ' + declaration}`)(...Object.values(dependencies))
}

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

test('una edici¢n de leyenda expl¡cita s¡ actualiza configuraci¢n y revisi¢n', t => {
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
