import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import Vue from 'vue'

import { NOMINATIM_ERROR_KIND, NominatimError } from '../src/components/search_engines/nominatimClient.js'
import { createPlaceSearch } from '../src/components/search_engines/placeSearch.js'

Vue.config.productionTip = false
Vue.config.devtools = false

const SANTIAGO = Object.freeze({ label: 'Santiago, Chile', lat: -33.43, lon: -70.65, bounds: [[-33.52, -70.74], [-33.34, -70.56]] })
const TALCA = Object.freeze({ label: 'Talca, Chile', lat: -35.42, lon: -71.66, bounds: null })

// Vue cambia el prototipo de los arreglos reactivos; se comparan copias planas.
const plain = (value) => JSON.parse(JSON.stringify(value))

// Carga el <script> real del SFC sin bootstrap-vue ni CSS, para ejecutar sus métodos sobre
// una instancia Vue sin montar (no necesita DOM).
async function loadComponent() {
    const componentUrl = new URL('../src/components/search_engines/SearchBarNominatim.vue', import.meta.url)
    const placeSearchUrl = new URL('../src/components/search_engines/placeSearch.js', import.meta.url)
    let script = readFileSync(componentUrl, 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]
    const bootstrapImport = /import \{([^}]+)\} from "bootstrap-vue";/
    const stubs = script.match(bootstrapImport)[1].split(',').map((name) => `${name.trim()} = {}`)
    script = script
        .replace(bootstrapImport, `const ${stubs.join(', ')};`)
        .replace(/import "[^"]+\.css";/g, '')
        .replace('"./placeSearch.js"', JSON.stringify(placeSearchUrl.href))

    const dir = mkdtempSync(join(tmpdir(), 'search-bar-nominatim-'))
    const file = join(dir, 'SearchBarNominatim.mjs')
    writeFileSync(file, script)
    try {
        return (await import(pathToFileURL(file).href)).default
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
}

const componentPromise = loadComponent()

// Cliente cuyas respuestas se resuelven a mano, para simular una búsqueda en curso.
function deferredClient() {
    const pending = []
    return {
        pending,
        search: (query) => new Promise((resolve, reject) => pending.push({ query, resolve, reject })),
    }
}

async function createSearchBar(client) {
    const component = await componentPromise
    const vm = new Vue({ ...component, propsData: { config: {} } })
    vm.placeSearch = createPlaceSearch(client)
    const events = []
    vm.$on('change-location', (value) => events.push(['change-location', value]))
    vm.$on('change-bounds', (value) => events.push(['change-bounds', value]))
    return { vm, events }
}

for (const places of [[SANTIAGO], [SANTIAGO, TALCA]]) {
    test(`borrar durante la búsqueda descarta la respuesta tardía (${places.length} lugar/es)`, async () => {
        const client = deferredClient()
        const { vm, events } = await createSearchBar(client)
        vm.addressOrLocation = 'Santiago'
        const searching = vm.search()
        assert.equal(vm.loading, true)

        vm.clearSearch()
        assert.equal(vm.loading, false)
        client.pending[0].resolve(places)
        await searching

        assert.equal(vm.addressOrLocation, '')
        assert.deepEqual(plain(vm.results), [])
        assert.equal(vm.message, '')
        assert.deepEqual(events, [])
    })
}

test('un error que llega después de borrar no muestra mensaje', async () => {
    const client = deferredClient()
    const { vm } = await createSearchBar(client)
    vm.addressOrLocation = 'Santiago'
    const searching = vm.search()
    vm.clearSearch()
    client.pending[0].reject(new NominatimError(NOMINATIM_ERROR_KIND.BUSY, 'ocupado', 429))
    await searching
    assert.equal(vm.message, '')
})

test('una respuesta tardía después de destruir el buscador no emite movimientos', async () => {
    const client = deferredClient()
    const { vm, events } = await createSearchBar(client)
    vm.addressOrLocation = 'Santiago'
    const searching = vm.search()
    vm.$destroy()
    client.pending[0].resolve([SANTIAGO])
    await searching
    assert.deepEqual(plain(vm.results), [])
    assert.deepEqual(events, [])
})

test('después de borrar, una búsqueda nueva no la pisa la respuesta anterior', async () => {
    const client = deferredClient()
    const { vm } = await createSearchBar(client)
    vm.addressOrLocation = 'Santiago'
    const first = vm.search()
    vm.clearSearch()
    vm.addressOrLocation = 'Talca'
    const second = vm.search()

    client.pending[1].resolve([TALCA])
    await second
    client.pending[0].resolve([SANTIAGO])
    await first
    assert.deepEqual(plain(vm.results), [TALCA])
    assert.equal(vm.loading, false)
})

test('un único lugar se muestra en la lista y el mapa se mueve solo al elegirlo', async () => {
    const client = deferredClient()
    const { vm, events } = await createSearchBar(client)
    vm.addressOrLocation = 'Santiago'
    const searching = vm.search()
    client.pending[0].resolve([SANTIAGO])
    await searching

    assert.deepEqual(plain(vm.results), [SANTIAGO])
    assert.deepEqual(events, [])

    vm.selectPlace(vm.results[0])
    assert.equal(vm.addressOrLocation, SANTIAGO.label)
    assert.deepEqual(plain(events), [['change-location', [SANTIAGO.lat, SANTIAGO.lon]], ['change-bounds', SANTIAGO.bounds]])
})

test('las coordenadas centran el mapa sin consultar al proveedor', async () => {
    const client = deferredClient()
    const { vm, events } = await createSearchBar(client)
    vm.addressOrLocation = '-33.45, -70.66'
    await vm.search()
    assert.equal(client.pending.length, 0)
    assert.equal(vm.loading, false)
    assert.deepEqual(events, [['change-location', [-33.45, -70.66]]])
})

test('sin coincidencias, ocupado y falla muestran su mensaje y liberan la búsqueda', async () => {
    const originalConsoleError = console.error
    console.error = () => {}
    try {
        const outcomes = [
            [(pending) => pending.resolve([]), 'No se encontraron lugares'],
            [(pending) => pending.reject(new NominatimError(NOMINATIM_ERROR_KIND.BUSY, 'ocupado', 429)), 'El buscador está ocupado, intenta en unos segundos'],
            [(pending) => pending.reject(new NominatimError(NOMINATIM_ERROR_KIND.FAILED, 'falla')), 'No se pudo consultar el buscador'],
        ]
        for (const [settle, message] of outcomes) {
            const client = deferredClient()
            const { vm } = await createSearchBar(client)
            vm.addressOrLocation = 'Curicó'
            const searching = vm.search()
            settle(client.pending[0])
            await searching
            assert.equal(vm.message, message)
            assert.equal(vm.loading, false)
        }
    } finally {
        console.error = originalConsoleError
    }
})
