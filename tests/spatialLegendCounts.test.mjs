import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import axios from 'axios'
import { fetchVectorTileLegendCounts } from '../src/services/vectorTileLegendService.js'
import { inferVectorTileLayerNameFromUrl } from '../src/utils/vectorTileLegend/config.js'
import { defaultCountLegend, legendCountGroups, mergeExactLegendCounts, pendingLegendCounts } from '../src/utils/vectorTileLegend/counts.js'
import { selectionViewport } from '../src/utils/vectorTileLegend/selection.js'

const base = defaultCountLegend({ name: 'Capa', sh_map_has_layer_color: '#123456' })
const response = count => ({ total_count: count, geometry_type: 'Polygon', counts: { all_features: count } })
const source = readFileSync(new URL('../src/components/layers/VectorTileLayer.vue', import.meta.url), 'utf8')

function method(name, dependencies = {}, code = source) {
    const raw = code.match(new RegExp(`^ {8}(?:async )?${name}\\([^\\n]*\\) \\{[\\s\\S]*?^ {8}\\},`, 'm'))[0].trim().slice(0, -1)
    const declaration = raw.startsWith('async ') ? `async function ${raw.slice(6)}` : `function ${raw}`
    return new Function(...Object.keys(dependencies), `return ${declaration}`)(...Object.values(dependencies))
}

function controller(fetchCounts) {
    const emitted = []
    const vm = { layer: {}, drawnAreas: [], request_auth: null, legendCountRequestId: 0,
        legendCountAbortController: null, isDestroyed: () => false,
        applySelectionCountResult() {},
        buildRawFilteredTileUrl: () => 'https://gis.test/vector/tiles/demo?filter.kind=eq.a',
        emitLegend: legend => emitted.push(legend) }
    vm.cancelLegendCountEnrichment = method('cancelLegendCountEnrichment').bind(vm)
    vm.enrichLegendCounts = method('enrichLegendCounts', {
        fetchVectorTileLegendCounts: fetchCounts, inferVectorTileLayerNameFromUrl,
        pendingLegendCounts, legendCountGroups, mergeExactLegendCounts,
        selectionViewport,
    }).bind(vm)
    return { vm, emitted }
}

test('count predicates preserve categorical, null and numeric class boundaries', () => {
    assert.deepEqual(legendCountGroups({ attribute: 'kind', legendType: 'categorical', items: [
        { key: 'edited', expressionKey: 'a' }, { key: 'missing', source: 'null' },
    ] }), [
        { key: 'edited', filters: [{ field: 'kind', operator: 'eq', raw_value: 'a' }] },
        { key: 'missing', filters: [{ field: 'kind', operator: 'isnull' }] },
    ])
    const numeric = legendCountGroups({ attribute: 'value', legendType: 'numeric', items: [
        { key: 'low', minValue: 0, maxValue: 10, includeMax: false },
        { key: 'last', minValue: 10, maxValue: 20, includeMax: true },
    ] })
    assert.equal(numeric[0].filters[1].operator, 'lt')
    assert.equal(numeric[1].filters[1].operator, 'lte')
    assert.deepEqual(legendCountGroups(base), [{ key: 'all_features', filters: [] }])
})

test('zero is a real count; counts never replace persisted labels, colors or classes', () => {
    const merged = mergeExactLegendCounts(base, response(0), true)
    assert.equal(merged.items[0].count, 0)
    assert.equal(merged.items[0].fill, '#123456')
    assert.equal(merged.items[0].label, base.items[0].label)
    assert.equal(merged.spatialFiltered, true)
    assert.equal(base.items[0].count, null)
    assert.throws(() => mergeExactLegendCounts(base, { total_count: 1, counts: {} }, true))
    assert.throws(() => mergeExactLegendCounts(base, response(-1), true))
})

test('POST counts keeps business filters, trusted auth and cancellation signal', async t => {
    const previous = globalThis.window
    globalThis.window = { location: { origin: 'https://map.test' } }
    t.after(() => { globalThis.window = previous })
    const calls = []
    t.mock.method(axios, 'post', async (...args) => { calls.push(args); return { data: response(3) } })
    const requestAuth = { isTrustedUrl: url => new URL(url).origin === 'https://gis.test',
        getHeaders: async () => ({ Authorization: 'Bearer synthetic-token' }) }
    const signal = new AbortController().signal
    const groups = legendCountGroups(base)
    await fetchVectorTileLegendCounts({ tileUrl: 'https://gis.test/vector/tiles/demo/{z}/{x}/{y}.pbf?filter.kind=eq.a',
        layerName: 'demo', areas: [], groups, requestAuth, signal })
    assert.equal(calls[0][0], 'https://gis.test/vector/layers/demo/counts?filter.kind=eq.a')
    assert.deepEqual(calls[0][1], { areas: [], groups })
    assert.equal(calls[0][2].headers.Authorization, 'Bearer synthetic-token')
    assert.equal(calls[0][2].signal, signal)
})

test('clearing drawings cancels old count work and ignores a late spatial response', async () => {
    const pending = []
    const { vm, emitted } = controller(args => new Promise(resolve => pending.push({ args, resolve })))
    vm.drawnAreas = [{ type: 'Polygon', coordinates: [] }]
    const old = vm.enrichLegendCounts(base)
    vm.drawnAreas = []
    const current = vm.enrichLegendCounts(base)
    assert.equal(pending[0].args.signal.aborted, true)
    assert.deepEqual(pending[1].args.areas, [])
    pending[1].resolve(response(0))
    await current
    pending[0].resolve(response(99))
    await old
    assert.equal(emitted.at(-1).items[0].count, 0)
    assert.equal(emitted.at(-1).spatialFiltered, false)
})

test('a failed count is unavailable rather than a fake zero or a stale global count', async t => {
    t.mock.method(console, 'warn', () => {})
    const { vm, emitted } = controller(async () => { throw new Error('Request failed') })
    vm.drawnAreas = [{ type: 'Polygon', coordinates: [] }]
    await vm.enrichLegendCounts({ ...base, items: [{ ...base.items[0], count: 42 }] })
    assert.equal(emitted.at(-1).countStatus, 'error')
    assert.equal(emitted.at(-1).items[0].count, null)
    assert.equal(emitted.at(-1).spatialFiltered, true)
})

test('implicit viewport filtering preserves drawings; explicit view filtering clears them', () => {
    const code = readFileSync(new URL('../src/components/SheetsMap.vue', import.meta.url), 'utf8')
    const findBounds = method('findBounds', {}, code)
    const vm = { drawn_areas: [{}] }
    findBounds.call(vm) // It must return before deleting shapes or reading viewport bounds.
    const calls = []
    vm.$refs = { polygon_drafter: { deleteAll: () => { vm.drawn_areas = []; calls.push('clear') } } }
    vm.findBounds = () => calls.push('viewport')
    method('filter', {}, code).call(vm)
    assert.deepEqual(calls, ['clear', 'viewport'])
})

test('drawing and erasing consume map clicks before vector feature details', () => {
    const code = readFileSync(new URL('../src/components/SheetsMap.vue', import.meta.url), 'utf8')
    const click = method('onMapClick', {}, code)
    let featureQueries = 0
    const drafter = { drawing: true, buttons_pressed: { delete: false } }
    const vm = { $refs: { polygon_drafter: drafter,
        vectorTileLayers: [{ tryHandleClick: () => { featureQueries++; return false } }] },
        clearAllHighlightsExcept: () => {} }
    click.call(vm, {})
    drafter.drawing = false
    drafter.buttons_pressed.delete = true
    click.call(vm, {})
    assert.equal(featureQueries, 0)
    drafter.buttons_pressed.delete = false
    click.call(vm, {})
    assert.equal(featureQueries, 1)
})

test('the annotation fallback refetches tile bodies instead of retaining the old URL cache', async () => {
    const url = 'https://gis.test/vector/tiles/demo/{z}/{x}/{y}.pbf'
    const source = { tiles: [url], setTiles(tiles) { this.tiles = tiles } }
    const requests = []
    const vm = { drawnAreas: [{ type: 'Polygon', coordinates: [] }], buildFilteredTileUrl: () => url, isDestroyed: () => false,
        maplibreMap: { getSource: () => source, isStyleLoaded: () => true,
            refreshTiles: id => requests.push({ id, areas: vm.drawnAreas }) } }
    const refresh = method('applyTileFilter').bind(vm)
    await refresh()
    vm.drawnAreas = []
    await refresh()
    assert.deepEqual(requests.map(r => r.areas), [[{ type: 'Polygon', coordinates: [] }], []])
    assert.ok(requests.every(r => r.id === 'vector-tiles'))
    assert.deepEqual(source.tiles, [url]) // No geometry or synthetic selection token enters the URL.
})

test('the drawing watcher reuses loaded tiles while requesting exact membership', () => {
    let counts = 0, tiles = 0
    const vm = { drawnAreas: [{}], cancelLegendCountEnrichment() {}, applyStyleExpressionsToLiveLayer() {},
        currentStyleExpressions: {}, maplibreMap: { getSource: () => ({ tiles: ['keyed-tiles'] }) },
        buildFilteredTileUrl: () => 'keyed-tiles', applyTileFilter: () => tiles++,
        resolveRenderState: () => ({ legend: base }), scheduleLegendCountEnrichment: () => counts++ }
    const watcher = source.match(/legendCountScope\(\) \{([\s\S]*?)^ {8}\}/m)[1]
    new Function(watcher).call(vm)
    assert.equal(counts, 1)
    assert.equal(tiles, 0)
})

test('attribute and label URL changes use setTiles without a duplicate forced refresh', async () => {
    const next = 'https://gis.test/vector/tiles/demo/{z}/{x}/{y}.pbf?filter.kind=eq.a&labels=true'
    const calls = []
    const source = { tiles: ['previous'], setTiles: tiles => calls.push(tiles) }
    const vm = { buildFilteredTileUrl: () => next, isDestroyed: () => false,
        maplibreMap: { getSource: () => source, isStyleLoaded: () => true,
            refreshTiles: () => assert.fail('Duplicate tile refresh') } }
    await method('applyTileFilter').call(vm)
    assert.deepEqual(calls, [[next]])
    vm.maplibreMap = null
    await method('applyTileFilter').call(vm) // A late watcher after cleanup is harmless.
})

test('a paused paint source finishes its reparse before refresh and ignores obsolete selections', async () => {
    let rendered
    let paused = true
    let requests = 0
    const source = { tiles: ['tile'], setTiles() {} }
    const map = { getSource: () => source, isStyleLoaded: () => !paused, once: event => {
        assert.equal(event, 'idle')
        return new Promise(resolve => { rendered = () => { paused = false; resolve() } })
    }, triggerRepaint() {}, refreshTiles() { assert.equal(paused, false); requests++ } }
    const vm = { maplibreMap: map, legendCountScope: 'first', isDestroyed: () => false, buildFilteredTileUrl: () => 'tile' }
    const refresh = method('applyTileFilter').bind(vm)
    const first = refresh()
    assert.equal(requests, 0)
    rendered()
    await first
    assert.equal(requests, 1)
    paused = true
    const obsolete = refresh()
    vm.legendCountScope = 'newer'
    rendered()
    await obsolete
    assert.equal(requests, 1)
})
