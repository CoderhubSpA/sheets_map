import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const readToolsSource = () => readFileSync(
    new URL('../src/components/SheetsMapTools.vue', import.meta.url),
    'utf8',
)

test('el botón de colapso va junto al ícono de filtro del grupo y lo colapsa y expande', () => {
    const tools = readToolsSource()

    assert.match(tools, /<button[^>]*group-collapse-button[^>]*@click="toggleGroupCollapse\(group_key\)"/)
    assert.match(tools, /Colapsar agrupación/)
    assert.match(tools, /Expandir agrupación/)
    // Vue 2 elimina los atributos con valor false: sin String() se perdería aria-expanded="false".
    assert.match(tools, /:aria-expanded="String\(/)
    assert.match(tools, /<div class="grouped-title-controls">[\s\S]*?filter-circle-fill[\s\S]*?group-collapse-button[\s\S]*?<\/div>/)
    assert.match(tools, /\.grouped-title-controls\s*\{[^}]*display:\s*flex/)
    // El botón envuelve al ícono sin cambiar su caja: el ícono sigue alineado con el título del grupo.
    assert.match(tools, /\.group-collapse-button\s*\{[^}]*display:\s*flex/)
    // Los márgenes del ícono van en el botón: dentro de él serían una zona muerta clicable.
    assert.match(tools, /\.group-collapse-button\s+svg\s*\{[^}]*margin:\s*0/)
})

test('el colapso usa $set: Vue 2 no detecta las claves nuevas de un objeto reactivo', () => {
    assert.match(
        readToolsSource(),
        /toggleGroupCollapse\(groupKey\)\s*\{\s*this\.\$set\(this\.collapsed_groups,\s*groupKey,/,
    )
})

test('el colapso oculta los subgrupos con v-show para conservar su contenido y configuración', () => {
    const subgroupContainer = readToolsSource().match(/<div[^>]*class="subgroup-container"[^>]*>/)?.[0]

    assert.ok(subgroupContainer, 'no se encontró el contenedor de subgrupo')
    assert.match(subgroupContainer, /v-show="!isGroupCollapsed\(group_key\)"/)
})

test('el filtro por agrupación se conserva: ícono y título siguen llamando a get_layers_group', () => {
    const tools = readToolsSource()
    const filterIcon = tools.match(/<b-icon[^>]*icon="filter-circle-fill"[^>]*>/)?.[0]

    assert.ok(filterIcon, 'no se encontró el ícono de filtro')
    // Sin v-if: el ícono está en todos los grupos y actúa donde haya filter_layers configurado.
    assert.doesNotMatch(filterIcon, /v-if/)
    assert.match(filterIcon, /@click="get_layers_group\(group, group_key\)"/)
    assert.match(tools, /<h5 @click="get_layers_group\(group, group_key\)">/)
})
