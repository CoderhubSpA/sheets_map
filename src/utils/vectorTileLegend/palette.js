const PALETTES = {
    tableau10: ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC'],
    set3: ['#8DD3C7', '#FFFFB3', '#BEBADA', '#FB8072', '#80B1D3', '#FDB462', '#B3DE69', '#FCCDE5', '#D9D9D9', '#BC80BD', '#CCEBC5', '#FFED6F'],
    paired12: ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C', '#FB9A99', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#6A3D9A', '#FFFF99', '#B15928'],
    category20: ['#1F77B4', '#AEC7E8', '#FF7F0E', '#FFBB78', '#2CA02C', '#98DF8A', '#D62728', '#FF9896', '#9467BD', '#C5B0D5', '#8C564B', '#C49C94', '#E377C2', '#F7B6D2', '#7F7F7F', '#C7C7C7', '#BCBD22', '#DBDB8D', '#17BECF', '#9EDAE5'],
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

function normalizeHexColor(color) {
    if (typeof color !== 'string') return null

    const trimmedColor = color.trim()
    const shortHexMatch = /^#([\da-fA-F]{3})$/

    if (shortHexMatch.test(trimmedColor)) {
        const [, shortHex] = trimmedColor.match(shortHexMatch)
        return `#${shortHex.split('').map(char => `${char}${char}`).join('')}`.toUpperCase()
    }

    if (/^#([\da-fA-F]{6})$/.test(trimmedColor)) {
        return trimmedColor.toUpperCase()
    }

    return null
}

function hexToRgb(hexColor) {
    const normalizedHex = normalizeHexColor(hexColor)
    if (!normalizedHex) return null

    return {
        r: parseInt(normalizedHex.slice(1, 3), 16),
        g: parseInt(normalizedHex.slice(3, 5), 16),
        b: parseInt(normalizedHex.slice(5, 7), 16),
    }
}

function rgbToHex({ r, g, b }) {
    return `#${[r, g, b].map(value => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function stableHash(input) {
    const stringInput = String(input || '')
    let hash = 0

    for (let index = 0; index < stringInput.length; index += 1) {
        hash = ((hash << 5) - hash) + stringInput.charCodeAt(index)
        hash |= 0
    }

    return Math.abs(hash)
}

export function getPaletteColors(paletteName = 'tableau10') {
    return PALETTES[paletteName] || PALETTES.tableau10
}

export function buildAutomaticPaletteMap(keys = [], paletteName = 'tableau10') {
    const palette = getPaletteColors(paletteName)
    const normalizedKeys = [...new Set(keys.map(key => String(key)).filter(Boolean))].sort()
    const assignedSlots = new Set()

    return normalizedKeys.reduce((accumulator, key) => {
        let paletteIndex = stableHash(key) % palette.length

        if (assignedSlots.size < palette.length) {
            while (assignedSlots.has(paletteIndex)) {
                paletteIndex = (paletteIndex + 1) % palette.length
            }
        }

        assignedSlots.add(paletteIndex)
        accumulator[key] = palette[paletteIndex] || palette[0]
        return accumulator
    }, {})
}

export function deriveStrokeColor(fillColor, darkenRatio = 0.22) {
    const rgb = hexToRgb(fillColor)

    if (!rgb) {
        return fillColor
    }

    return rgbToHex({
        r: rgb.r * (1 - darkenRatio),
        g: rgb.g * (1 - darkenRatio),
        b: rgb.b * (1 - darkenRatio),
    })
}

export function normalizeColorValue(color, fallbackColor = null) {
    return normalizeHexColor(color) || normalizeHexColor(fallbackColor) || fallbackColor
}