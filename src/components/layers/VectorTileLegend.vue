<template>
    <div class="vector-tile-legend" v-if="legend && visibleItems.length > 0">
        <div class="vector-tile-legend__title">
            <b>{{ legend.title || layer.name }}</b>
        </div>

        <div class="vector-tile-legend__subtitle" v-if="legend.attribute">
            {{ legend.attribute }}
        </div>

        <div
            v-for="item in visibleItems"
            :key="`${layer.id}-${item.key}`"
            class="vector-tile-legend__item"
        >
            <i class="vector-tile-legend__swatch" :style="itemStyle(item)"></i>
            <span class="vector-tile-legend__label">{{ item.label }}</span>
            <span class="vector-tile-legend__count" v-if="item.count !== null && item.count !== undefined">
                ({{ formatCount(item.count) }})
            </span>
        </div>
    </div>
</template>

<script>
export default {
    name: 'VectorTileLegend',
    props: {
        layer: {
            type: Object,
            required: true,
        },
        legend: {
            type: Object,
            required: true,
        },
    },
    computed: {
        visibleItems() {
            return Array.isArray(this.legend?.items) ? this.legend.items : []
        },
    },
    methods: {
        normalizeLegendPointSize(item) {
            const pointSize = Number(item?.pointSize)
            if (Number.isFinite(pointSize) && pointSize > 0) {
                return Math.max(10, Math.min(20, pointSize * 2))
            }

            return 18
        },
        normalizeLegendStrokeWidth(item) {
            const strokeWidth = Number(item?.pointStrokeWidth)
            if (Number.isFinite(strokeWidth) && strokeWidth >= 0) {
                return Math.max(1, Math.min(4, strokeWidth))
            }

            return 1
        },
        isLineGeometry() {
            const geomType = String(this.legend?.geometryType || '').toLowerCase()
            return geomType.includes('line')
        },
        itemStyle(item) {
            if (this.isLineGeometry()) {
                return {
                    background: item.fill,
                    borderColor: item.stroke || item.fill,
                    borderStyle: 'none',
                    borderWidth: '0',
                    width: '22px',
                    height: '4px',
                    borderRadius: '2px',
                    clipPath: 'none',
                    transform: 'none',
                }
            }

            const shape = String(item?.pointShape || 'circle').toLowerCase()
            const size = this.normalizeLegendPointSize(item)

            return {
                background: item.fill,
                borderColor: item.stroke || item.fill,
                borderStyle: 'solid',
                borderWidth: `${this.normalizeLegendStrokeWidth(item)}px`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: shape === 'circle' ? '50%' : '2px',
                clipPath: shape === 'triangle' ? 'polygon(50% 8%, 8% 90%, 92% 90%)' : 'none',
                transform: shape === 'diamond' ? 'rotate(45deg)' : 'none',
            }
        },
        formatCount(count) {
            return Number(count).toLocaleString('es-ES')
        },
    },
}
</script>

<style scoped>
.vector-tile-legend {
    background: white;
    padding: 0 8px 6px 8px;
}

.vector-tile-legend__title {
    padding-bottom: 2px;
}

.vector-tile-legend__subtitle {
    color: #666;
    font-size: 12px;
    margin-bottom: 6px;
}

.vector-tile-legend__item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.vector-tile-legend__swatch {
    width: 18px;
    height: 18px;
    display: inline-block;
    opacity: 0.8;
    flex-shrink: 0;
}

.vector-tile-legend__label,
.vector-tile-legend__count {
    font-size: 14px;
}

.vector-tile-legend__count {
    color: #666;
}
</style>