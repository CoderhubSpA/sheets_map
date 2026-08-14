import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeVectorTileLegendConfig } from '../src/utils/vectorTileLegend/config.js'
import {
    applyGlobalVectorTileStyleUpdate,
    applySemanticLegendToDraft,
    createVectorTileLegendDraft,
    isVectorTileSymbologyEligible,
    normalizeVectorTileStyleValue,
    serializeVectorTileLegendDraft,
    stringifyVectorTileLegendConfig,
    validateVectorTileLegendDraft,
} from '../src/utils/vectorTileLegend/editor.js'
import {
    buildVectorTilePreviewLayers,
    buildVectorTilePreviewRenderState,
    normalizeVectorTileSpatialContext,
} from '../src/utils/vectorTileLegend/preview.js'
import {
    buildVectorTileSemanticRenderState,
    mergeVectorTileLegendCounts,
} from '../src/utils/vectorTileLegend/style.js'
import { buildPointShapeIconExpression, parsePointShapeImageId } from '../src/utils/vectorTileLegend/icon.js'
import { buildFilteredVectorTileUrl } from '../src/utils/vectorTileUrl.js'
import { normalizePointCanvasStrokeWidth, pointCanvasDashPattern } from '../src/utils/vectorTileLegend/canvas.js'
import {
    COPY_ERROR_MESSAGE,
    COPY_SUCCESS_MESSAGE,
    CLIPBOARD_WRITE_TIMEOUT_MS,
    copySerializedLegendConfig,
    copyText,
} from '../src/utils/clipboard.js'
import { readFileSync } from 'node:fs'

const layer = {
    id: 7,
    name: 'Comunas',
    sh_map_has_layer_code: 'operative_vector_tiles_xyz',
    sh_map_has_layer_geoserver_layer: 'comunas',
    sh_map_has_layer_color: '#336699',
}

test('detecta únicamente capas Vector Tiles XYZ', () => {
    assert.equal(isVectorTileSymbologyEligible(layer), true)
    assert.equal(isVectorTileSymbologyEligible({ sh_map_has_layer_code: 'operative_geoserver_wms' }), false)
})

test('crea defaults seguros cuando legend_config es inválido', () => {
    const originalWarn = console.warn
    console.warn = () => {}
    const draft = createVectorTileLegendDraft({ ...layer, sh_map_has_layer_legend_config: '{bad' })
    console.warn = originalWarn
    assert.equal(draft.mode, 'thematic')
    assert.equal(draft.layerName, 'comunas')
    assert.equal(draft.fallbackColor, '#336699')
})

test('usa el nombre visible de la capa y deja copiable la configuración completa', () => {
    const workingLayer = {
        ...layer,
        name: undefined,
        value: 'Puntos APC Nacional',
    }
    const draft = createVectorTileLegendDraft(workingLayer)
    const configured = applySemanticLegendToDraft({ ...draft, attribute: 'ciudad' }, {
        geometry_type: 'Point',
        attribute: 'ciudad',
        legend_type: 'categorical',
        classes: [{ key: 'Talca', label: 'Talca', count: 12 }],
    })

    assert.equal(draft.title, 'Puntos APC Nacional')
    assert.deepEqual(validateVectorTileLegendDraft(configured), [])
    assert.equal(
        JSON.parse(stringifyVectorTileLegendConfig(configured)).vector_tile_legend.legend_title,
        'Puntos APC Nacional',
    )
})

test('mantiene compatibilidad con colors legacy', () => {
    const config = normalizeVectorTileLegendConfig({
        ...layer,
        sh_map_has_layer_legend_config: JSON.stringify({
            vector_tile_legend: { enabled: true, attribute: 'tipo', colors: { A: '#ff0000' } },
        }),
    })
    assert.equal(config.palette.items.A.fill, '#FF0000')
})

test('crea clases categóricas sin mutar el draft de entrada', () => {
    const draft = createVectorTileLegendDraft(layer)
    draft.attribute = 'tipo'
    const original = JSON.stringify(draft)
    const next = applySemanticLegendToDraft(draft, {
        legend_type: 'categorical', geometry_type: 'MultiPolygon', classes: [{ key: 'A', label: 'Clase A' }],
    })
    assert.equal(JSON.stringify(draft), original)
    assert.equal(next.items[0].key, 'A')
    assert.equal(next.geometryType, 'MultiPolygon')
})

test('oscurece automáticamente el borde de clases nuevas en capas de puntos', () => {
    const draft = createVectorTileLegendDraft(layer)
    const next = applySemanticLegendToDraft(draft, {
        legend_type: 'categorical',
        geometry_type: 'Point',
        classes: [{ key: 'A', label: 'Clase A' }, { key: 'B', label: 'Clase B' }],
    })
    assert.equal(next.items[0].fill, '#4E79A7')
    assert.equal(next.items[0].stroke, '#3D5E82')
    assert.notEqual(next.items[0].stroke, next.items[0].fill)

    const customized = applySemanticLegendToDraft({
        ...next,
        items: [{ ...next.items[0], stroke: '#123456' }],
    }, {
        legend_type: 'categorical',
        geometry_type: 'Point',
        classes: [{ key: 'A', label: 'Clase A' }],
    })
    assert.equal(customized.items[0].stroke, '#123456')
})

test('preserva rangos numéricos editables', () => {
    const draft = applySemanticLegendToDraft(createVectorTileLegendDraft(layer), {
        legend_type: 'numeric', ranges: [{ min_value: 0, max_value: 10, label: '0 a 10' }],
    })
    const config = serializeVectorTileLegendDraft({ ...draft, attribute: 'poblacion' })
    assert.equal(config.vector_tile_legend.palette.items['0 a 10'].min_value, 0)
    assert.equal(config.vector_tile_legend.palette.items['0 a 10'].max_value, 10)
})

test('mantiene independientes rangos numéricos con etiquetas redondeadas repetidas', () => {
    const semanticLegend = {
        attribute: 'lat',
        legend_type: 'numeric',
        geometry_type: 'Point',
        ranges: [
            { min_value: -22.5002, max_value: -22.5001, label: '-22.5 - -22.5' },
            { min_value: -22.5001, max_value: -22.5, label: '-22.5 - -22.5' },
        ],
    }
    const draft = applySemanticLegendToDraft({
        ...createVectorTileLegendDraft(layer),
        attribute: 'lat',
    }, semanticLegend)

    assert.equal(new Set(draft.items.map(item => item.key)).size, 2)
    assert.equal(
        Object.keys(serializeVectorTileLegendDraft(draft).vector_tile_legend.palette.items).length,
        2,
    )
})

test('actualiza colores numéricos por clase y usa sin clasificación como fallback del preview', () => {
    const semanticLegend = {
        attribute: 'lat',
        legend_type: 'numeric',
        geometry_type: 'Point',
        ranges: [
            { min_value: -22.5002, max_value: -22.5001, label: '-22.5 - -22.5' },
            { min_value: -22.5001, max_value: -22.5, label: '-22.5 - -22.5' },
        ],
    }
    let draft = applySemanticLegendToDraft({
        ...createVectorTileLegendDraft(layer),
        attribute: 'lat',
        nullColor: '#BD0000',
    }, semanticLegend)
    draft = {
        ...draft,
        items: draft.items.map((item, index) => ({
            ...item,
            fill: index === 0 ? '#112233' : '#FFFFFF',
        })),
    }

    const renderState = buildVectorTilePreviewRenderState(draft, layer, semanticLegend)
    const fillExpression = renderState.styleExpressions.fillColorExpression

    assert.equal(fillExpression[0], 'case')
    assert.match(JSON.stringify(fillExpression), /#112233/)
    assert.match(JSON.stringify(fillExpression), /#FFFFFF/)
    assert.equal(fillExpression.at(-1), '#BD0000')

    const hiddenFallback = buildVectorTilePreviewRenderState({
        ...draft,
        showUnclassified: false,
    }, layer, semanticLegend)
    assert.equal(hiddenFallback.styleExpressions.circleOpacityExpression.at(-1), 0)
})

test('serializa JSON determinista con opacidad, borde, dash y punto', () => {
    const draft = {
        ...createVectorTileLegendDraft(layer), mode: 'simple', title: 'Comunas', fillOpacity: 0.45,
        borderEnabled: false, dashStyle: 'dotted', pointShape: 'diamond', pointSize: 12,
        showInMapLegend: false, showUnclassified: false, nullColor: '#010203',
    }
    const first = stringifyVectorTileLegendConfig(draft)
    const second = stringifyVectorTileLegendConfig(draft)
    const parsed = JSON.parse(first).vector_tile_legend
    assert.equal(first, second)
    assert.equal(parsed.style.fill_opacity, 0.45)
    assert.equal(parsed.style.border_enabled, false)
    assert.equal(parsed.style.dash_style, 'dotted')
    assert.equal(parsed.point_style.shape, 'diamond')
    assert.equal(parsed.visibility.show_in_map_legend, false)
    assert.equal(parsed.visibility.show_unclassified, false)
    assert.equal(parsed.palette.null_color, '#010203')
})

test('el legend_config excluye transparencia y filtros de la pestaña Filtros', () => {
    const draft = {
        ...createVectorTileLegendDraft(layer),
        mode: 'simple',
        title: 'Comunas',
        opacity: 0.25,
        filterAttribute: 'comuna',
        filterValue: 'Talca',
    }
    const serialized = stringifyVectorTileLegendConfig(draft)
    const config = JSON.parse(serialized)

    assert.equal(config.vector_tile_legend.legend_title, 'Comunas')
    assert.doesNotMatch(serialized, /filterAttribute|filterValue|"opacity"|"filter"/)
})

test('valida atributos y clases para modo temático', () => {
    const draft = createVectorTileLegendDraft(layer)
    assert.equal(validateVectorTileLegendDraft(draft).length, 2)
    assert.equal(validateVectorTileLegendDraft({ ...draft, mode: 'simple' }).length, 0)
})

test('el parser serializado es el mismo contrato aplicado al render simple', () => {
    const draft = { ...createVectorTileLegendDraft(layer), mode: 'simple', title: 'Comunas', pointShape: 'square' }
    const serialized = stringifyVectorTileLegendConfig(draft)
    const runtimeLayer = { ...layer, sh_map_has_layer_legend_config: serialized }
    const config = normalizeVectorTileLegendConfig(runtimeLayer)
    const state = buildVectorTileSemanticRenderState({ layer: runtimeLayer, config, semanticLegend: {} })
    assert.equal(state.legend.legendType, 'simple')
    assert.equal(state.legend.items[0].pointShape, 'square')
    assert.equal(state.styleExpressions.useSymbolForPointShape, true)
})

test('aplica colores categóricos al contrato MapLibre', () => {
    let draft = { ...createVectorTileLegendDraft(layer), attribute: 'tipo' }
    const semanticLegend = {
        attribute: 'tipo', legend_type: 'categorical', geometry_type: 'Polygon',
        classes: [{ key: 'A', label: 'A' }, { key: 'B', label: 'B' }],
    }
    draft = applySemanticLegendToDraft(draft, semanticLegend)
    const runtimeLayer = { ...layer, sh_map_has_layer_legend_config: stringifyVectorTileLegendConfig(draft) }
    const state = buildVectorTileSemanticRenderState({
        layer: runtimeLayer,
        config: normalizeVectorTileLegendConfig(runtimeLayer),
    })
    assert.equal(state.styleExpressions.fillColorExpression[0], 'match')
    assert.equal(state.legend.items.length, 2)
})

test('aplica rangos numéricos configurados a las expresiones', () => {
    let draft = { ...createVectorTileLegendDraft(layer), attribute: 'valor' }
    const semanticLegend = {
        attribute: 'valor', legend_type: 'numeric', geometry_type: 'LineString',
        ranges: [{ min_value: 0, max_value: 10, label: 'Bajo' }],
    }
    draft = applySemanticLegendToDraft(draft, semanticLegend)
    draft.items[0].maxValue = 12
    const runtimeLayer = { ...layer, sh_map_has_layer_legend_config: stringifyVectorTileLegendConfig(draft) }
    const state = buildVectorTileSemanticRenderState({
        layer: runtimeLayer,
        config: normalizeVectorTileLegendConfig(runtimeLayer),
    })
    assert.equal(state.legend.items[0].maxValue, 12)
    assert.equal(state.styleExpressions.fillColorExpression[0], 'case')
})

test('genera fallback editable para atributos de texto', () => {
    const draft = applySemanticLegendToDraft(
        { ...createVectorTileLegendDraft(layer), attribute: 'descripcion' },
        { attribute: 'descripcion', legend_type: 'text', geometry_type: 'MultiPoint', sample_size: 25 },
    )
    assert.equal(draft.items[0].key, 'high_cardinality_text')
    assert.equal(draft.items[0].count, 25)
})

test('preserva rangos numéricos después de serializar, parsear y reconstruir draft', () => {
    let draft = applySemanticLegendToDraft(
        { ...createVectorTileLegendDraft(layer), attribute: 'valor' },
        { legend_type: 'numeric', ranges: [{ min_value: 0, max_value: 10, label: 'Bajo' }] },
    )
    draft.items[0].minValue = -2
    draft.items[0].maxValue = 12
    const restored = createVectorTileLegendDraft({
        ...layer,
        sh_map_has_layer_legend_config: stringifyVectorTileLegendConfig(draft),
    })
    assert.equal(restored.items[0].minValue, -2)
    assert.equal(restored.items[0].maxValue, 12)
    const refreshed = applySemanticLegendToDraft(restored, {
        legend_type: 'numeric', ranges: [{ min_value: 0, max_value: 10, label: 'Bajo' }],
    })
    assert.equal(refreshed.items[0].minValue, -2)
    assert.equal(refreshed.items[0].maxValue, 12)
})

test('usa color y label editados para high_cardinality_text y acepta la clave legacy', () => {
    const semanticLegend = {
        attribute: 'texto', legend_type: 'text', geometry_type: 'MultiPoint',
        classes: [{ key: 'high_cardinality_text', label: 'Texto' }],
    }
    let draft = applySemanticLegendToDraft(
        { ...createVectorTileLegendDraft(layer), attribute: 'texto' },
        semanticLegend,
    )
    draft.items[0] = { ...draft.items[0], label: 'Descripción propia', fill: '#123456', point: { ...draft.items[0].point, shape: 'diamond' } }
    const runtimeLayer = { ...layer, sh_map_has_layer_legend_config: stringifyVectorTileLegendConfig(draft) }
    const state = buildVectorTileSemanticRenderState({
        layer: runtimeLayer,
        config: normalizeVectorTileLegendConfig(runtimeLayer),
    })
    assert.equal(state.legend.items[0].label, 'Descripción propia')
    assert.equal(state.legend.items[0].fill, '#123456')
    assert.equal(state.legend.items[0].pointShape, 'diamond')
    assert.equal(state.styleExpressions.fillColorExpression, '#123456')
    assert.equal(state.styleExpressions.strokeColorExpression, draft.items[0].stroke)
    assert.equal(state.styleExpressions.pointRadiusExpression, draft.pointSize)
    assert.equal(state.styleExpressions.pointShapeExpression, 'diamond')
    assert.equal(typeof state.styleExpressions.fillColorExpression, 'string')

    const legacy = createVectorTileLegendDraft({
        ...layer,
        sh_map_has_layer_legend_config: JSON.stringify({ vector_tile_legend: {
            enabled: true, attribute: 'texto', palette: { items: { __TEXT_FALLBACK__: { fill: '#abcdef' } } },
        } }),
    })
    assert.equal(legacy.items[0].key, 'high_cardinality_text')
})

test('conserva el filtro en la URL inicial y respeta query params existentes', () => {
    assert.equal(
        buildFilteredVectorTileUrl('/vector/tiles/capa/{z}/{x}/{y}.pbf', 'comuna', 'Santiago Centro'),
        '/vector/tiles/capa/{z}/{x}/{y}.pbf?filter.comuna=eq.Santiago%20Centro',
    )
    assert.equal(
        buildFilteredVectorTileUrl('/tiles?token=abc', 'id', 7),
        '/tiles?token=abc&filter.id=eq.7',
    )
})

test('construye símbolos no circulares para simple, categórico, numérico y texto', () => {
    const simple = buildPointShapeIconExpression(null, [
        { pointShape: 'square', fill: '#111111', stroke: '#222222', pointStrokeWidth: 2 },
    ], '#000000', '#000000')
    assert.match(simple, /square/)

    const categorical = buildPointShapeIconExpression('tipo', [
        { expressionKey: 'A', pointShape: 'triangle', fill: '#111111', stroke: '#222222', pointStrokeWidth: 2 },
    ], '#000000', '#000000')
    assert.equal(categorical[0], 'match')
    assert.match(categorical[3], /triangle/)

    const numeric = buildPointShapeIconExpression('valor', [
        { minValue: 0, maxValue: 10, includeMax: true, pointShape: 'diamond', fill: '#111111', stroke: '#222222', pointStrokeWidth: 2 },
    ], '#000000', '#000000')
    assert.equal(numeric[0], 'case')
    assert.match(numeric[2], /diamond/)

    const text = buildPointShapeIconExpression('texto', [
        { key: 'high_cardinality_text', pointShape: 'square', fill: '#111111', stroke: '#222222', pointStrokeWidth: 2 },
    ], '#000000', '#000000')
    assert.equal(typeof text, 'string')
    assert.match(text, /square/)
})

test('preserva ancho de borde cero en el icon id y canvas', () => {
    const icon = buildPointShapeIconExpression(null, [
        { pointShape: 'square', fill: '#111111', stroke: '#222222', pointStrokeWidth: 0 },
    ], '#000000', '#000000')
    assert.match(icon, /-0-solid$/)
    assert.equal(normalizePointCanvasStrokeWidth(0), 0)
    assert.equal(normalizePointCanvasStrokeWidth(undefined), 3)
})

test('parsea image ids preservando cero y usando fallback para ancho inválido o ausente', () => {
    assert.deepEqual(parsePointShapeImageId('vtl-shape-square-111111-222222-0'), {
        shape: 'square', fill: '#111111', stroke: '#222222', strokeWidth: 0, dashStyle: 'solid',
    })
    assert.equal(parsePointShapeImageId('vtl-shape-triangle-111111-222222-invalid').strokeWidth, 3)
    assert.equal(parsePointShapeImageId('vtl-shape-diamond-111111-222222').strokeWidth, 3)
    assert.equal(parsePointShapeImageId('otro-id'), null)
})

test('codifica y dibuja bordes continuos, segmentados y punteados en puntos', () => {
    const icon = buildPointShapeIconExpression(null, [{
        pointShape: 'circle',
        fill: '#111111',
        stroke: '#222222',
        pointStrokeWidth: 2,
        dashStyle: 'dotted',
    }], '#000000', '#000000')
    assert.match(icon, /-2-dotted$/)
    assert.equal(parsePointShapeImageId(icon).dashStyle, 'dotted')
    assert.deepEqual(pointCanvasDashPattern('solid', 2), [])
    assert.deepEqual(pointCanvasDashPattern('dashed', 2), [16, 10])
    assert.deepEqual(pointCanvasDashPattern('dotted', 2), [3, 8])

    const draft = {
        ...createVectorTileLegendDraft(layer),
        mode: 'simple',
        geometryType: 'Point',
        pointShape: 'circle',
        dashStyle: 'dashed',
    }
    const state = buildVectorTilePreviewRenderState(draft, layer)
    const layers = buildVectorTilePreviewLayers('puntos', state.styleExpressions)
    assert.equal(state.styleExpressions.useSymbolForPointShape, true)
    assert.match(layers.find(candidate => candidate.id === 'preview-point-symbol').layout['icon-image'], /-dashed$/)
    assert.equal(layers.find(candidate => candidate.id === 'preview-point').paint['circle-opacity'], 0)
})

test('clipboard informa fallo sin quedar pendiente cuando el permiso es rechazado', async () => {
    assert.equal(
        await copyText('json', { clipboard: { writeText: async () => { throw new Error('DENIED') } } }),
        false,
    )
})

test('clipboard usa un timeout acotado si writeText queda pendiente', async () => {
    const pendingClipboard = { clipboard: { writeText: () => new Promise(() => {}) } }
    const startedAt = Date.now()
    assert.equal(await copyText('json', pendingClipboard, null, 5), false)
    assert.ok(Date.now() - startedAt < 250)
    assert.equal(CLIPBOARD_WRITE_TIMEOUT_MS, 1200)
})

test('copySerializedLegendConfig copia exactamente JSON parseable y retorna feedback accesible', async () => {
    const draft = {
        ...createVectorTileLegendDraft(layer),
        mode: 'simple',
        title: 'Leyenda APC',
    }
    let copiedText = null
    const success = await copySerializedLegendConfig(draft, async text => {
        copiedText = text
    })
    assert.equal(success.success, true)
    assert.equal(success.message, COPY_SUCCESS_MESSAGE)
    assert.equal(success.json, copiedText)
    assert.deepEqual(JSON.parse(copiedText), serializeVectorTileLegendDraft(draft))

    const failure = await copySerializedLegendConfig(draft, async () => {
        throw new Error('Clipboard blocked')
    })
    assert.equal(failure.success, false)
    assert.equal(failure.message, COPY_ERROR_MESSAGE)
    assert.deepEqual(JSON.parse(failure.json), serializeVectorTileLegendDraft(draft))

    const component = readFileSync(
        new URL('../src/components/VectorTileLayerSettingsModal.vue', import.meta.url),
        'utf8',
    )
    assert.match(component, /@click="copySerializedLegendConfig"/)
    assert.doesNotMatch(component, /Copiando JSON/)
    assert.match(component, /aria-live="polite"\s+role="status"/)
    assert.match(component, /this\.generatedJson = stringifyVectorTileLegendConfig\(this\.draft\)/)
    assert.match(component, /Promise\.resolve\(writer\(this\.generatedJson\)\)/)
    assert.match(component, /this\.showCopyFeedback\(COPY_SUCCESS_MESSAGE\)/)
    assert.match(component, /duration = 2000/)
    assert.match(component, /\.copy-feedback\s*\{[^}]*margin-right:\s*auto/s)
    assert.match(component, /v-show="copyFeedback"/)
    assert.match(component, /border-radius:\s*999px/)
    assert.match(component, /showManualCopyFallback\(\)/)
    assert.match(component, /v-if="manualJsonVisible"/)
    assert.match(component, /:value="generatedJson"[\s\S]*readonly/)
    assert.match(component, /aria-label="Configuración de leyenda en JSON"/)
    assert.match(component, /this\.manualJsonVisible = true/)
    assert.match(component, /this\.\$nextTick\(\(\) => this\.selectGeneratedJson\(\)\)/)
})

test('valida límites, orden, solapamientos y continuidad de rangos', () => {
    const base = {
        ...createVectorTileLegendDraft(layer),
        attribute: 'valor',
        legendType: 'numeric',
        rangesContinuous: true,
    }
    assert.match(validateVectorTileLegendDraft({ ...base, items: [{ minValue: 5, maxValue: 1 }] })[0], /mínimo/)
    assert.ok(validateVectorTileLegendDraft({
        ...base,
        items: [{ minValue: 0, maxValue: 10 }, { minValue: 9, maxValue: 20 }],
    }).some(error => error.includes('superponen')))
    assert.ok(validateVectorTileLegendDraft({
        ...base,
        items: [{ minValue: 0, maxValue: 10 }, { minValue: 11, maxValue: 20 }],
    }).some(error => error.includes('hueco')))
    assert.deepEqual(validateVectorTileLegendDraft({
        ...base,
        items: [{ minValue: 0, maxValue: 10 }, { minValue: 10, maxValue: 20 }],
    }), [])
})

test('limita inmediatamente valores de estilo escritos con teclado', () => {
    assert.equal(normalizeVectorTileStyleValue('lineWidth', 99), 20)
    assert.equal(normalizeVectorTileStyleValue('lineWidth', -4), 0)
    assert.equal(normalizeVectorTileStyleValue('lineOpacity', 3), 1)
    assert.equal(normalizeVectorTileStyleValue('lineOpacity', -1), 0)
    assert.equal(normalizeVectorTileStyleValue('pointSize', 100), 64)
    assert.equal(normalizeVectorTileStyleValue('pointStrokeWidth', 30), 16)
})

test('los controles generales conservan los overrides específicos de las clases', () => {
    const original = {
        fallbackColor: '#111111',
        strokeColor: '#222222',
        pointShape: 'circle',
        pointSize: 8,
        pointStrokeWidth: 2,
        items: [
            { key: 'A', fill: '#aaaaaa', stroke: '#bbbbbb', point: { shape: 'circle', size: 6, strokeWidth: 1 } },
            { key: 'B', fill: '#cccccc', stroke: '#dddddd', point: { shape: 'square', size: 9, strokeWidth: 3 } },
        ],
    }
    const withFill = applyGlobalVectorTileStyleUpdate(original, 'fallbackColor', '#123456')
    const withShape = applyGlobalVectorTileStyleUpdate(withFill, 'pointShape', 'triangle')
    const withSize = applyGlobalVectorTileStyleUpdate(withShape, 'pointSize', 18)
    const withStroke = applyGlobalVectorTileStyleUpdate(withSize, 'pointStrokeWidth', 5)

    assert.deepEqual(withStroke.items, original.items)
    assert.equal(withStroke.fallbackColor, '#123456')
    assert.equal(withStroke.pointShape, 'triangle')
    assert.equal(withStroke.pointSize, 18)
    assert.equal(withStroke.pointStrokeWidth, 5)
    assert.equal(original.items[0].fill, '#aaaaaa')
})

test('las clases heredan el estilo global y sus overrides tienen prioridad completa', () => {
    const semanticLegend = {
        layer_name: 'comunas',
        geometry_type: 'MultiPoint',
        attribute: 'tipo',
        legend_type: 'categorical',
        classes: [{ key: 'A', label: 'A' }, { key: 'B', label: 'B' }],
    }
    let draft = applySemanticLegendToDraft({
        ...createVectorTileLegendDraft(layer),
        attribute: 'tipo',
        pointShape: 'diamond',
        pointSize: 3,
        pointStrokeWidth: 1,
        fillOpacity: 0.6,
        strokeWidth: 2,
        strokeOpacity: 0.8,
        lineWidth: 2.5,
        lineOpacity: 0.85,
        dashStyle: 'solid',
    }, semanticLegend)
    draft.items[0] = {
        ...draft.items[0],
        point: { shape: 'square', size: 9, strokeWidth: 4 },
        style: {
            fillOpacity: 0.2,
            borderEnabled: true,
            strokeWidth: 6,
            strokeOpacity: 0.4,
            lineWidth: 7,
            lineOpacity: 0.3,
            dashStyle: 'dotted',
        },
    }

    const serialized = stringifyVectorTileLegendConfig(draft)
    const runtimeLayer = { ...layer, sh_map_has_layer_legend_config: serialized }
    const state = buildVectorTileSemanticRenderState({
        layer: runtimeLayer,
        config: normalizeVectorTileLegendConfig(runtimeLayer),
        semanticLegend,
    })
    const [specific, inherited] = state.legend.items

    assert.equal(specific.pointShape, 'square')
    assert.equal(specific.pointSize, 9)
    assert.equal(specific.pointStrokeWidth, 4)
    assert.equal(specific.fillOpacity, 0.2)
    assert.equal(specific.strokeWidth, 6)
    assert.equal(specific.strokeOpacity, 0.4)
    assert.equal(specific.lineWidth, 7)
    assert.equal(specific.lineOpacity, 0.3)
    assert.equal(specific.dashStyle, 'dotted')
    assert.equal(inherited.pointShape, 'diamond')
    assert.equal(inherited.pointSize, 3)
    assert.equal(inherited.fillOpacity, 0.6)
    assert.equal(inherited.lineWidth, 2.5)
    assert.equal(inherited.dashStyle, 'solid')
    assert.ok(state.styleExpressions.pointRadiusExpression.includes(9))
    assert.ok(state.styleExpressions.pointRadiusExpression.includes(3))
    assert.ok(state.styleExpressions.lineWidthExpression.includes(7))
    assert.ok(state.styleExpressions.lineOpacityExpression.includes(0.3))
    assert.ok(state.styleExpressions.polygonFillOpacityExpression.includes(0.2))
    assert.deepEqual(state.styleExpressions.lineDashArray[3], ['literal', [1, 2]])
})

test('el tamaño inicial de puntos es 3 y una forma global no circular no deja círculos residuales', () => {
    const draft = {
        ...createVectorTileLegendDraft({ ...layer, sh_map_has_layer_color: '#00aa00' }),
        mode: 'simple',
        geometryType: 'Point',
        pointShape: 'diamond',
    }
    assert.equal(draft.pointSize, 3)

    const state = buildVectorTilePreviewRenderState(draft, layer)
    const layers = buildVectorTilePreviewLayers('puntos', state.styleExpressions)
    assert.match(layers.find(candidate => candidate.id === 'preview-point-symbol').layout['icon-image'], /^vtl-shape-diamond-/)
    assert.equal(layers.find(candidate => candidate.id === 'preview-point').paint['circle-opacity'], 0)
})

test('el preview usa el mismo render state y no superpone círculos bajo símbolos', () => {
    const draft = applySemanticLegendToDraft({
        ...createVectorTileLegendDraft(layer),
        attribute: 'tipo',
        title: 'Comunas por tipo',
        strokeWidth: 7,
        strokeOpacity: 0.35,
    }, {
        layer_name: 'comunas',
        geometry_type: 'MultiPolygon',
        attribute: 'tipo',
        legend_type: 'categorical',
        classes: [{ key: 'A', label: 'A' }, { key: 'B', label: 'B' }],
    })
    const renderState = buildVectorTilePreviewRenderState(draft, layer)
    assert.deepEqual(renderState.styleExpressions.polygonStrokeWidthExpression.slice(-5), ['A', 7, 'B', 7, 7])
    assert.deepEqual(renderState.styleExpressions.polygonStrokeOpacityExpression.slice(-5), ['A', 0.35, 'B', 0.35, 0.35])
    assert.equal(renderState.legend.title, 'Comunas por tipo')

    const layers = buildVectorTilePreviewLayers('comunas', renderState.styleExpressions)
    assert.equal(layers.filter(candidate => candidate.type === 'fill').length, 1)
    assert.equal(layers.filter(candidate => candidate.type === 'line').length, 2)
    assert.deepEqual(layers.find(candidate => candidate.id === 'preview-polygon-border').paint['line-width'], renderState.styleExpressions.polygonStrokeWidthExpression)

    const defaultLayers = buildVectorTilePreviewLayers('comunas', {
        fillColorExpression: '#3388FF',
        strokeColorExpression: '#225588',
    })
    defaultLayers.forEach(candidate => {
        Object.values(candidate.paint).forEach(value => assert.notEqual(value, undefined))
    })

    const pointLayers = buildVectorTilePreviewLayers('puntos', {
        fillColorExpression: '#3388FF',
        strokeColorExpression: '#225588',
        pointRadiusExpression: 14,
        pointStrokeOpacityExpression: 0.3,
        iconOpacityExpression: 0.4,
        useSymbolForPointShape: true,
        legendItems: [{ key: 'A', expressionKey: 'A', fill: '#3388FF', stroke: '#225588', pointShape: 'triangle', pointSize: 14, pointStrokeWidth: 2 }],
        legendAttribute: 'tipo',
        defaultFillColor: '#3388FF',
        defaultStrokeColor: '#225588',
    })
    assert.equal(pointLayers.find(candidate => candidate.id === 'preview-point').paint['circle-opacity'], 0)
    assert.equal(pointLayers.find(candidate => candidate.id === 'preview-point').paint['circle-stroke-opacity'], 0)
    assert.equal(pointLayers.find(candidate => candidate.id === 'preview-point-symbol').paint['icon-opacity'], 0.4)
    assert.equal(pointLayers.find(candidate => candidate.id === 'preview-point-symbol').layout['icon-image'][0], 'match')

    const liveLayer = readFileSync(
        new URL('../src/components/layers/VectorTileLayer.vue', import.meta.url),
        'utf8',
    )
    assert.match(liveLayer, /paint\.useSymbolForPointShape \? 0 : paint\.pointStrokeOpacityExpression/)
    assert.match(liveLayer, /paint\.useSymbolForPointShape \? paint\.iconOpacityExpression : 0/)
})

test('el preview temático sin atributo reacciona al estilo general sin inventar una leyenda', () => {
    const draft = {
        ...createVectorTileLegendDraft(layer),
        geometryType: 'LineString',
        fallbackColor: '#123456',
        lineWidth: 9,
        lineOpacity: 0.25,
        dashStyle: 'dashed',
    }
    const renderState = buildVectorTilePreviewRenderState(draft, layer)

    assert.equal(renderState.legend, null)
    assert.equal(renderState.styleExpressions.fillColorExpression, '#123456')
    assert.equal(renderState.styleExpressions.lineWidthExpression, 9)
    assert.equal(renderState.styleExpressions.lineOpacityExpression, 0.25)
    assert.deepEqual(renderState.styleExpressions.lineDashArray, [3, 2])
})

test('enriquece solo las cantidades sin reemplazar estilos ni etiquetas visibles', () => {
    const baseLegend = {
        title: 'Leyenda persistida',
        items: [
            { key: 'A', label: 'Etiqueta editada', fill: '#112233', stroke: '#010203', count: null },
            { key: 'B', label: 'Sin respuesta', fill: '#445566', count: null },
        ],
        nullCount: 0,
    }
    const countedLegend = {
        title: 'Título del backend que no debe reemplazar al persistido',
        items: [
            { key: 'A', label: 'Etiqueta del backend', fill: '#ffffff', count: 1250 },
            { key: 'C', label: 'Clase no configurada', count: 99 },
        ],
        nullCount: 7,
    }

    const enriched = mergeVectorTileLegendCounts(baseLegend, countedLegend)

    assert.equal(enriched.title, 'Leyenda persistida')
    assert.deepEqual(enriched.items[0], {
        key: 'A',
        label: 'Etiqueta editada',
        fill: '#112233',
        stroke: '#010203',
        count: 1250,
    })
    assert.strictEqual(enriched.items[1], baseLegend.items[1])
    assert.equal(enriched.items.length, 2)
    assert.equal(enriched.nullCount, 7)
    assert.equal(baseLegend.items[0].count, null)
})

test('asocia cantidades numéricas por límites cuando la clave del backend difiere', () => {
    const baseLegend = {
        items: [{ key: 'Rango personalizado', minValue: 0, maxValue: 10, fill: '#123456', count: null }],
    }
    const countedLegend = {
        items: [{ key: '0.0 - 10.0', minValue: 0, maxValue: 10, count: 42 }],
    }

    const enriched = mergeVectorTileLegendCounts(baseLegend, countedLegend)

    assert.equal(enriched.items[0].count, 42)
    assert.equal(enriched.items[0].key, 'Rango personalizado')
    assert.equal(enriched.items[0].fill, '#123456')
})

test('activar una capa muestra primero legend_config y luego enriquece sus cantidades', () => {
    const liveLayer = readFileSync(
        new URL('../src/components/layers/VectorTileLayer.vue', import.meta.url),
        'utf8',
    )
    const settingsModal = readFileSync(
        new URL('../src/components/VectorTileLayerSettingsModal.vue', import.meta.url),
        'utf8',
    )
    const legendComponent = readFileSync(
        new URL('../src/components/layers/VectorTileLegend.vue', import.meta.url),
        'utf8',
    )

    assert.match(liveLayer, /fetchVectorTileSemanticLegend/)
    assert.match(liveLayer, /buildVectorTileSemanticRenderState\(\{[\s\S]*?config: legendConfig,[\s\S]*?\}\)/)
    assert.ok(
        liveLayer.indexOf('this.emitLegend(renderState.legend);') <
            liveLayer.indexOf('this.scheduleLegendCountEnrichment(renderState.legend);'),
        'La leyenda persistida debe emitirse antes de programar la consulta de cantidades',
    )
    assert.match(liveLayer, /scheduleLegendCountEnrichment\(baseLegend\)[\s\S]*this\.\$nextTick/s)
    assert.match(liveLayer, /legendConfig\.mode === 'manual'/)
    assert.match(liveLayer, /mergeVectorTileLegendCounts\([\s\S]*baseLegend,[\s\S]*countedRenderState\.legend/s)
    assert.match(liveLayer, /Ante cualquier error se conserva la leyenda que ya está visible/)
    assert.match(legendComponent, /\(\{\{ formatCount\(item\.count\) \}\}\)/)
    assert.match(settingsModal, /fetchVectorTileSemanticLegend/)
})

test('el preview carga solamente tiles visibles y reacciona al completar la leyenda', () => {
    const preview = readFileSync(
        new URL('../src/components/VectorTileSymbologyPreview.vue', import.meta.url),
        'utf8',
    )
    assert.match(preview, /type:\s*'vector'/)
    assert.match(preview, /tiles:\s*\[this\.tileUrl\]/)
    assert.match(preview, /maxTileCacheSize:\s*6/)
    assert.match(preview, /type:\s*'raster'[\s\S]*tile\.openstreetmap/s)
    assert.match(preview, /querySourceFeatures[\s\S]*\.slice\(0, 200\)/)
    assert.match(preview, /fitToSpatialContext\(\)/)
    assert.match(preview, /fitBounds\(\[\[minX, minY\], \[maxX, maxY\]\]/)
    assert.match(preview, /center:\s*this\.viewport\.centroid \|\| INITIAL_CENTER/)
    assert.match(preview, /semanticLegend:\s*\{[\s\S]*deep:\s*true[\s\S]*scheduleLiveStyle/s)
    assert.match(preview, /requestAnimationFrame[\s\S]*applyLiveStyle/s)
    assert.doesNotMatch(preview, /if \(!this\.map \|\| !this\.map\.isStyleLoaded\(\)\)/)
    assert.match(preview, /setLayoutProperty/)
    assert.match(preview, /styleimagemissing/)
    assert.match(preview, /parsePointShapeImageId/)
    assert.match(preview, /buildVectorTilePreviewLayers\(this\.sourceLayer, this\.renderState\.styleExpressions\)/)
    assert.doesNotMatch(preview, /Vista acotada a los tiles visibles|previewDescription|performance-note|datos reales|data-badge|type:\s*'geojson'/)
})

test('normaliza bbox y centroide WGS84 para encuadrar la vista previa', () => {
    assert.deepEqual(
        normalizeVectorTileSpatialContext({
            bbox: [-75, -55, -66, -18],
            centroid: [-70.5, -36.5],
        }),
        { bbox: [-75, -55, -66, -18], centroid: [-70.5, -36.5] },
    )
    assert.deepEqual(
        normalizeVectorTileSpatialContext({ bbox: [-72, -36, -70, -34] }),
        { bbox: [-72, -36, -70, -34], centroid: [-71, -35] },
    )
    assert.deepEqual(
        normalizeVectorTileSpatialContext(
            { bbox: ['invalid'], centroid: [200, 100] },
            { bbox: [-71, -35, -70, -34], centroid: [-70.5, -34.5] },
        ),
        { bbox: [-71, -35, -70, -34], centroid: [-70.5, -34.5] },
    )
})

test('la vista previa conserva separación inferior uniforme', () => {
    const preview = readFileSync(
        new URL('../src/components/VectorTileSymbologyPreview.vue', import.meta.url),
        'utf8',
    )
    assert.match(preview, /\.symbology-preview__legend-area\s*\{[^}]*margin:\s*0 16px 16px/s)
    assert.match(preview, /@media \(max-width: 600px\)[\s\S]*margin:\s*0 12px 12px/s)
})

test('el modal mantiene header y footer visibles con body scroll en viewports bajos', () => {
    const component = readFileSync(
        new URL('../src/components/VectorTileLayerSettingsModal.vue', import.meta.url),
        'utf8',
    )
    assert.match(component, /modal-class="vector-tile-settings-modal"/)
    assert.match(component, /dialog-class="vector-tile-settings-dialog"/)
    assert.match(component, /body-class="vector-tile-settings-body"/)
    assert.match(component, /hide-footer/)
    assert.match(component, /<footer class="settings-footer">/)
    assert.match(component, /max-height:\s*calc\(100dvh - 1rem\)/)
    assert.match(component, /\.vector-tile-settings-body\s*\{[^}]*overflow:\s*hidden/s)
    assert.match(component, /\.settings-workspace\s*\{[^}]*overflow-y:\s*auto/s)
    assert.match(component, /\.vector-tile-settings-modal\s*\{[^}]*overflow:\s*hidden/s)
    assert.match(component, /scrollbar-width:\s*none/)
    assert.match(component, /\.vector-tile-settings-body::-webkit-scrollbar\s*\{[^}]*width:\s*0/s)
    assert.match(component, /\.modal-header,[\s\S]*\.modal-footer\s*\{[^}]*flex:\s*0 0 auto/s)
})

test('el editor profesional separa pestañas, preview, trazos y colores de clases', () => {
    const modal = readFileSync(
        new URL('../src/components/VectorTileLayerSettingsModal.vue', import.meta.url),
        'utf8',
    )
    const editor = readFileSync(
        new URL('../src/components/VectorTileSymbologyEditor.vue', import.meta.url),
        'utf8',
    )
    const preview = readFileSync(
        new URL('../src/components/VectorTileSymbologyPreview.vue', import.meta.url),
        'utf8',
    )

    assert.match(modal, /role="tablist"/)
    assert.match(modal, />Simbología y leyenda</)
    assert.match(modal, />Filtros</)
    assert.match(modal, /activeTab:\s*'symbology'/)
    assert.doesNotMatch(modal, /filter-control--wide/)
    assert.doesNotMatch(modal, /Los filtros y la transparencia se aplican solamente durante esta sesión/)
    assert.match(modal, /filter-control--opacity[\s\S]*Nivel de transparencia[\s\S]*filter-control--attribute[\s\S]*Filtrar por atributo[\s\S]*filter-control--value[\s\S]*Valor del filtro/)
    assert.match(modal, /\.filter-control--opacity \.opacity-control\s*\{[^}]*width:\s*calc\(\(100% - 18px\) \/ 2\)/s)
    assert.match(editor, /<vector-tile-symbology-preview[\s\S]*:draft="draft"[\s\S]*:layer="layer"/)
    assert.match(editor, /:spatial-context="spatialContext"/)
    assert.match(editor, /role="radiogroup"\s+aria-label="Tipo de línea"/)
    assert.match(editor, /dash-option__sample--dashed/)
    assert.match(editor, /symbol:\s*'●'/)
    assert.match(editor, /symbol:\s*'■'/)
    assert.match(editor, /symbol:\s*'▲'/)
    assert.match(editor, /symbol:\s*'◆'/)
    assert.match(editor, /<small>0 – 1<\/small>/)
    assert.doesNotMatch(editor, /<small>0–1<\/small>/)
    assert.match(editor, /\.color-control code\s*\{[^}]*font-size:\s*\.875rem/s)
    assert.match(editor, /select\s*\{[^}]*padding-right:\s*38px[^}]*background-position:\s*right 12px center/s)
    assert.match(modal, /\.filter-control select\s*\{[^}]*padding-right:\s*38px[^}]*background-position:\s*right 12px center/s)
    assert.match(editor, /class-settings-grid/)
    assert.match(editor, /Personaliza la simbología de cada valor del atributo seleccionado\./)
    assert.match(editor, /<section class="editor-card">[\s\S]*?<h5>Definición de simbología<\/h5>/)
    assert.match(editor, /<section v-if="!hasSelectedAttribute" class="editor-card editor-card--general-style">[\s\S]*?<h5>Estilo de la geometría<\/h5>/)
    assert.match(editor, /<section v-if="hasSelectedAttribute" class="editor-card editor-card--classes" :aria-busy="String\(loading\)">/)
    assert.match(editor, /v-if="hasSelectedAttribute"[\s\S]*?<h5>Estilo de la geometría<\/h5>[\s\S]*?para las clases de \{\{ geometryDescription \}\}/)
    assert.match(editor, /<template v-if="draft\.items\.length">/)
    assert.match(editor, /v-else-if="loading" class="class-loading-placeholder" aria-hidden="true"/)
    assert.match(editor, /\.class-loading-placeholder\s*\{[^}]*min-height:\s*230px/s)
    assert.doesNotMatch(editor, /class-loading-placeholder__(tabs|panel|title)/)
    assert.doesNotMatch(editor, /class-placeholder-pulse/)
    assert.match(editor, /class="class-section-heading"[\s\S]*?<h6>Clases<\/h6>/)
    assert.match(editor, /role="tablist" aria-label="Clases de simbología"/)
    assert.doesNotMatch(editor, /title="Clase (anterior|siguiente)"/)
    assert.match(editor, /\.class-tabs__navigation\s*\{[^}]*color:\s*#7a8792/s)
    assert.match(editor, /\.class-tabs__navigation:hover:not\(:disabled\)[^{]*\{[^}]*color:\s*#0b5cad/s)
    assert.match(editor, /aria-label="Clase anterior"/)
    assert.match(editor, /aria-label="Clase siguiente"/)
    assert.match(editor, /class="class-tabs__navigation-icon"[\s\S]*?<path d="m12\.5 4\.5-5 5\.5 5 5\.5"/)
    assert.match(editor, /\.class-tabs__navigation-icon\s*\{[^}]*display:\s*block;[^}]*width:\s*20px;[^}]*height:\s*20px/s)
    assert.match(editor, /\.class-tabs__navigation:disabled\s*\{[^}]*cursor:\s*default/s)
    assert.ok(
        editor.indexOf('class="editor-card editor-card--classes"') < editor.indexOf('<h5>Leyenda</h5>'),
        'El estilo específico por clases debe reemplazar visualmente al estilo general antes de la leyenda',
    )
    assert.match(editor, /v-if="activeClass"[\s\S]*role="tabpanel"/)
    assert.match(editor, /moveClass\(direction\)[\s\S]*selectClass\(this\.activeClassIndex \+ direction\)/)
    assert.match(editor, /scrollIntoView\(\{ behavior: 'smooth', block: 'nearest', inline: 'center' \}\)/)
    assert.doesNotMatch(editor, /<h5>Símbolo de puntos<\/h5>/)
    assert.match(editor, /<h6>Relleno<\/h6>/)
    assert.match(editor, /<h6>Borde<\/h6>/)
    assert.match(editor, /<h6>Marcador<\/h6>/)
    assert.match(editor, /class="class-settings-grid class-settings-grid--label">[\s\S]*?<span>Etiqueta<\/span>[\s\S]*?<div v-if="!isLineGeometry" class="class-control-group">[\s\S]*?<h6>Relleno<\/h6>/)
    assert.match(editor, /<div v-if="!isLineGeometry" class="class-control-group">[\s\S]*?<h6>Borde<\/h6>/)
    assert.match(editor, /<div v-if="isPointGeometry" class="class-control-group">[\s\S]*?<h6>Marcador<\/h6>/)
    assert.match(editor, /<div v-if="isPolygonGeometry" class="class-control-group">[\s\S]*?<h6>Línea del borde<\/h6>/)
    assert.match(editor, /<div v-if="isLineGeometry" class="class-control-group">[\s\S]*?<h6>Línea<\/h6>/)
    assert.match(editor, /<span>Tipo de borde<\/span>[\s\S]*option\.symbol/)
    assert.match(editor, /aria-label="Tipo de borde de clase"/)
    assert.match(editor, /aria-label="Tipo de línea de clase"/)
    assert.match(editor, /isPolygonGeometry \? 'Línea del borde' : 'Línea'/)
    assert.doesNotMatch(editor, /Relleno y borde/)
    assert.doesNotMatch(editor, /Cargando definición de leyenda/)
    assert.match(editor, /updateBoundedNumber\(isPointGeometry \? 'pointStrokeWidth' : 'strokeWidth'/)
    assert.match(editor, /\.toggle-row\s*\{[^}]*margin-top:\s*18px/s)
    assert.match(preview, /Vista previa de simbología y leyenda/)
    assert.match(preview, /new maplibregl\.Map/)
    assert.match(preview, /\.symbology-preview\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0/s)
    assert.match(preview, /<vector-tile-legend/)
    assert.doesNotMatch(preview, /<svg/)
})

test('la leyenda y el mapa se ajustan al viewport sin depender del zoom del navegador', () => {
    const map = readFileSync(new URL('../src/components/SheetsMap.vue', import.meta.url), 'utf8')
    const legend = readFileSync(new URL('../src/components/layers/VectorTileLegend.vue', import.meta.url), 'utf8')

    assert.match(map, /updateMapViewportHeight\(\)/)
    assert.match(map, /window\.innerHeight - top/)
    assert.match(map, /height:\s*var\(--sh-map-available-height,\s*96dvh\)/)
    assert.match(map, /\.sheets-map-legend\s*\{[^}]*max-height:[^;}]+[^}]*overflow-y:\s*auto/s)
    assert.match(legend, /isPolygonGeometry\(\)/)
    assert.match(legend, /max-width:\s*min\(300px,\s*calc\(100vw - 32px\)\)/)
    assert.match(legend, /overflow-wrap:\s*anywhere/)
})

test('los textos del configurador usan español neutral y no voseo', () => {
    const files = [
        '../src/components/VectorTileLayerSettingsModal.vue',
        '../src/components/VectorTileSymbologyEditor.vue',
        '../src/components/VectorTileSymbologyPreview.vue',
        '../src/utils/clipboard.js',
        '../src/utils/vectorTileLegend/editor.js',
    ]
    const content = files
        .map(path => readFileSync(new URL(path, import.meta.url), 'utf8'))
        .join('\n')

    assert.doesNotMatch(
        content,
        /\b(?:ajustá|aplicá|configurá|controlá|copialo|definí|editá|elegí|ingresá|revisá|seleccioná)\b/i,
    )
    assert.match(content, /Selecciona un atributo para la simbología temática\./)
})
