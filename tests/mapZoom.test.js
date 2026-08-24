import test from 'node:test'
import assert from 'node:assert/strict'

import {
    clampMapZoomLevel,
    normalizeMapZoomLimit,
    resolveMapZoomBounds,
} from '../src/utils/mapZoom.js'

test('mantiene los límites históricos cuando minZoom y maxZoom se omiten', () => {
    assert.deepEqual(resolveMapZoomBounds(), {
        minZoom: 0,
        maxZoom: 20,
        shouldSetMinZoom: false,
        shouldSetMaxZoom: false,
    })
})

test('resuelve límites parciales sin perder la configuración vigente', () => {
    assert.deepEqual(
        resolveMapZoomBounds({ currentMinZoom: 4, currentMaxZoom: 18, minZoom: 7 }),
        {
            minZoom: 7,
            maxZoom: 18,
            shouldSetMinZoom: true,
            shouldSetMaxZoom: false,
        },
    )
    assert.deepEqual(
        resolveMapZoomBounds({ currentMinZoom: 4, currentMaxZoom: 18, maxZoom: 16 }),
        {
            minZoom: 4,
            maxZoom: 16,
            shouldSetMinZoom: false,
            shouldSetMaxZoom: true,
        },
    )
})

test('rechaza rangos invertidos y limita navegación en ambos extremos', () => {
    assert.equal(resolveMapZoomBounds({ minZoom: 12, maxZoom: 11 }), null)
    assert.equal(clampMapZoomLevel(7, 11, 19), 11)
    assert.equal(clampMapZoomLevel(15, 11, 19), 15)
    assert.equal(clampMapZoomLevel(22, 11, 19), 19)
})

test('acepta enteros y cadenas numéricas sin convertir valores vacíos a cero', () => {
    assert.equal(normalizeMapZoomLimit('11'), 11)
    assert.equal(normalizeMapZoomLimit(11), 11)
    assert.equal(normalizeMapZoomLimit(null), undefined)
    assert.equal(normalizeMapZoomLimit(undefined), undefined)
    assert.equal(normalizeMapZoomLimit(''), undefined)
    assert.equal(normalizeMapZoomLimit('   '), undefined)
    assert.equal(normalizeMapZoomLimit(false), undefined)
    assert.equal(normalizeMapZoomLimit([]), undefined)
    assert.equal(normalizeMapZoomLimit(-1), undefined)
    assert.equal(normalizeMapZoomLimit(1.5), undefined)
})

test('ignora límites vacíos y conserva los límites vigentes', () => {
    assert.deepEqual(
        resolveMapZoomBounds({
            currentMinZoom: 4,
            currentMaxZoom: 18,
            minZoom: null,
            maxZoom: '',
        }),
        {
            minZoom: 4,
            maxZoom: 18,
            shouldSetMinZoom: false,
            shouldSetMaxZoom: false,
        },
    )
})
