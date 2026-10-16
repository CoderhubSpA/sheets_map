import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createExpression } from '@maplibre/maplibre-gl-style-spec'
import { DRAWN_SELECTION_ATTRIBUTE, SELECTION_KEY_ATTRIBUTE, drawnSelectionOpacity, drawnSelectionTileRequest,
    featureKeyTileUrl, selectedFeatureKeys, selectionViewport, viewportContains, withoutSelectionMetadata } from '../src/utils/vectorTileLegend/selection.js'

function evaluate(expression, properties, state = {}) {
    const compiled = createExpression(expression)
    assert.equal(compiled.result, 'success', JSON.stringify(compiled.value))
    return compiled.value.evaluate({ zoom: 10 }, { type: 'Polygon', properties }, state)
}

test('MapLibre preserves class opacity, fades only false intersections and restores after clear', () => {
    const paletteOpacity = ['match', ['get', 'kind'], 'a', 0.6, 'b', 0.3, 0.8]
    const style = drawnSelectionOpacity(paletteOpacity, 0.5, true)
    assert.equal(evaluate(style, { kind: 'a', [DRAWN_SELECTION_ATTRIBUTE]: true }), 0.3)
    assert.equal(evaluate(style, { kind: 'b', [DRAWN_SELECTION_ATTRIBUTE]: true }), 0.15)
    assert.equal(evaluate(style, { kind: 'a', [DRAWN_SELECTION_ATTRIBUTE]: false }), 0.06)
    assert.equal(evaluate(style, { kind: 'a' }), 0.3) // Legacy data is not falsely rejected.
    assert.equal(evaluate(drawnSelectionOpacity(paletteOpacity, 0.5, false), { kind: 'a', [DRAWN_SELECTION_ATTRIBUTE]: false }), 0.3)
    assert.equal(evaluate(drawnSelectionOpacity(0, 1, true), { [DRAWN_SELECTION_ATTRIBUTE]: true }), 0)
})

test('only own vector tiles receive a POST mask, retaining scoped authentication and query filters', () => {
    const areas = [{ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [0, 1], [0, 0]]] }]
    const request = { url: 'https://gis.test/vector/tiles/demo/4/8/7.pbf?filter.kind=eq.a', headers: { Authorization: 'Bearer synthetic' } }
    const tileUrl = 'https://gis.test/vector/tiles/demo/{z}/{x}/{y}.pbf'
    const selected = drawnSelectionTileRequest(request, 'Tile', tileUrl, areas)
    assert.equal(selected.url, request.url)
    assert.equal(selected.method, 'POST')
    assert.equal(selected.headers.Authorization, 'Bearer synthetic')
    assert.equal(selected.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(selected.body), { areas })
    assert.equal(drawnSelectionTileRequest(request, 'Glyphs', tileUrl, areas), request)
    assert.equal(drawnSelectionTileRequest(request, 'Tile', 'https://external.test/vector/tiles/demo', areas), request)
    assert.equal(drawnSelectionTileRequest(request, 'Tile', tileUrl, []), request)
    assert.equal(request.method, undefined)
})

test('internal selection annotations do not enter feature details or mutate source properties', () => {
    const properties = { id: 1, kind: 'a', [DRAWN_SELECTION_ATTRIBUTE]: false, [SELECTION_KEY_ATTRIBUTE]: 'internal' }
    assert.deepEqual(withoutSelectionMetadata(properties), { id: 1, kind: 'a' })
    assert.equal(properties[DRAWN_SELECTION_ATTRIBUTE], false)
})

test('feature-state updates opacity independently of stale tile properties and preserves unknown records', () => {
    const style = drawnSelectionOpacity(0.6, 0.5, true, true)
    assert.equal(evaluate(style, { [DRAWN_SELECTION_ATTRIBUTE]: false }, { [DRAWN_SELECTION_ATTRIBUTE]: 'selected' }), 0.3)
    assert.equal(evaluate(style, {}, { [DRAWN_SELECTION_ATTRIBUTE]: 'rejected' }), 0.06)
    assert.equal(evaluate(style, { [DRAWN_SELECTION_ATTRIBUTE]: false }), 0.3)
})

test('geometry keys opt in without changing templates, filters or fragments; membership remains bounded', () => {
    const url = 'https://gis.test/vector/tiles/demo/{z}/{x}/{y}.pbf?filter.kind=eq.a#fragment'
    assert.equal(featureKeyTileUrl(url), url.replace('#fragment', '&feature_keys=true#fragment'))
    assert.equal(featureKeyTileUrl(featureKeyTileUrl(url)), featureKeyTileUrl(url))
    assert.equal(featureKeyTileUrl('https://external.test/tiles/{z}/{x}/{y}'), 'https://external.test/tiles/{z}/{x}/{y}')
    const key = 'g1:' + 'a'.repeat(64)
    assert.deepEqual([...selectedFeatureKeys([key, key])], [key])
    assert.equal(selectedFeatureKeys(null), null)
    assert.equal(selectedFeatureKeys(['untrusted']), null)
    assert.equal(selectedFeatureKeys(Array(10001).fill(key)), null)
    assert.equal(selectedFeatureKeys([]).size, 0) // A real zero is not the fallback marker.
})

test('viewport coverage prevents rejecting features newly loaded outside the queried extent', () => {
    const bounds = { pad() { return this }, getWest: () => -190, getEast: () => 190,
        getSouth: () => -100, getNorth: () => 100 }
    assert.deepEqual(selectionViewport({ getBounds: () => bounds }), [-180, -89.999, 180, 89.999])
    assert.equal(viewportContains([-1, -1, 2, 2], [0, 0, 1, 1]), true)
    assert.equal(viewportContains([-1, -1, 2, 2], [1, 0, 3, 1]), false)
})

test('exact membership updates all fragments and labels without tile requests, with zero and overflow fallback', () => {
    const source = readFileSync(new URL('../src/components/layers/VectorTileLayer.vue', import.meta.url), 'utf8')
    const dependencies = { selectedFeatureKeys, selectionViewport, viewportContains, DRAWN_SELECTION_ATTRIBUTE, SELECTION_KEY_ATTRIBUTE }
    const extract = name => {
        const method = source.match(new RegExp(`^ {8}${name}\\([^\\n]*\\) \\{[\\s\\S]*?^ {8}\\},`, 'm'))[0].trim().slice(0, -1)
        return new Function(...Object.keys(dependencies), `return function ${method}`)(...Object.values(dependencies))
    }
    const a = 'g1:' + 'a'.repeat(64), b = 'g1:' + 'b'.repeat(64)
    const state = new Map(), writes = []
    const bounds = { pad() { return this }, getWest: () => 0, getSouth: () => 0, getEast: () => 1, getNorth: () => 1 }
    let fallbacks = 0
    const vm = { drawnAreas: [{}], legendCountScope: 'mask', sourceLayer: 'demo', styleLoaded: true,
        map: { getBounds: () => bounds }, selectedFeatureKeys: null, applyStyleExpressionsToLiveLayer() {},
        applyTileFilter: () => fallbacks++,
        maplibreMap: { getSource: () => ({}),
            querySourceFeatures: () => [a, a, b].map(key => ({ properties: { [SELECTION_KEY_ATTRIBUTE]: key } })),
            getFeatureState: f => state.get(`${f.sourceLayer}:${f.id}`) || {},
            setFeatureState: (f, value) => { writes.push(f); state.set(`${f.sourceLayer}:${f.id}`, value) },
            removeFeatureState: f => [...state.keys()].filter(k => k.startsWith(f.sourceLayer + ':')).forEach(k => state.delete(k)) } }
    for (const name of ['clearSelectionFeatureState', 'applySelectionFeatureState', 'applySelectionCountResult']) vm[name] = extract(name).bind(vm)
    vm.applySelectionCountResult({ selected_keys: [a] }, [-1, -1, 2, 2])
    assert.equal(fallbacks, 0)
    assert.equal(writes.length, 4) // Two geometries, including duplicate fragments, in geometry and label layers.
    assert.equal(state.get('demo:' + a)[DRAWN_SELECTION_ATTRIBUTE], 'selected')
    assert.equal(state.get('demo_label:' + b)[DRAWN_SELECTION_ATTRIBUTE], 'rejected')
    vm.applySelectionFeatureState()
    assert.equal(writes.length, 4)
    vm.applySelectionCountResult({ selected_keys: [] }, [-1, -1, 2, 2])
    assert.ok([...state.values()].every(s => s[DRAWN_SELECTION_ATTRIBUTE] === 'rejected'))
    assert.ok([...state.values()].every(s => Boolean(s[DRAWN_SELECTION_ATTRIBUTE]))) // Bulk-removal replacements stay present.
    vm.applySelectionCountResult({ selected_keys: null }, [-1, -1, 2, 2])
    assert.equal(fallbacks, 1)
    vm.drawnAreas = []
    vm.applySelectionCountResult({}, null)
    assert.equal(fallbacks, 1)
    assert.equal(state.size, 0)
})
