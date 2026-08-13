<template>
    <div class="vector-tile-legend" v-if="legend && visibleItems.length > 0">
        <div class="vector-tile-legend__title">
            <b>{{ legend.title || layer.name }}</b>
        </div>

        <div class="vector-tile-legend__subtitle" v-if="legend.attribute">
            {{ legend.attribute }}
        </div>
        <div class="vector-tile-legend__description" v-if="legend.description">
            {{ legend.description }}
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
        isPolygonGeometry() {
            const geomType = String(this.legend?.geometryType || '').toLowerCase()
            return geomType.includes('polygon')
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
                    backgroundImage: this.legend.dashStyle === 'solid'
                        ? 'none'
                        : `repeating-linear-gradient(90deg, ${item.fill} 0 6px, transparent 6px ${this.legend.dashStyle === 'dotted' ? '10px' : '12px'})`,
                }
            }

            if (this.isPolygonGeometry()) {
                return {
                    background: item.fill,
                    borderColor: item.stroke || item.fill,
                    borderStyle: 'solid',
                    borderWidth: '2px',
                    width: '20px',
                    height: '16px',
                    borderRadius: '3px',
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
    min-width: 180px;
    max-width: min(300px, calc(100vw - 32px));
    padding: 12px 14px;
    border: 1px solid #dce4eb;
    border-radius: 9px;
    box-shadow: 0 8px 24px rgba(25, 46, 68, .14);
}

.vector-tile-legend__title {
    padding-bottom: 3px;
    color: #263746;
    line-height: 1.3;
    overflow-wrap: anywhere;
}

.vector-tile-legend__subtitle {
    color: #666;
    font-size: 12px;
    margin-bottom: 6px;
}

.vector-tile-legend__description {
    color: #555;
    font-size: 12px;
    margin-bottom: 6px;
    max-width: 240px;
    overflow-wrap: anywhere;
}

.vector-tile-legend__item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    margin-top: 6px;
}

.vector-tile-legend__swatch {
    width: 18px;
    height: 18px;
    display: inline-block;
    opacity: 0.8;
    flex-shrink: 0;
    box-sizing: border-box;
}

.vector-tile-legend__label,
.vector-tile-legend__count {
    font-size: 12px;
    line-height: 1.3;
}

.vector-tile-legend__label { min-width: 0; overflow-wrap: anywhere; }

.vector-tile-legend__count {
    color: #666;
    flex: 0 0 auto;
}

@media (max-width: 700px), (max-height: 700px) {
    .vector-tile-legend { min-width: 150px; max-width: min(250px, calc(100vw - 24px)); padding: 9px 10px; }
    .vector-tile-legend__item { gap: 6px; margin-top: 4px; }
    .vector-tile-legend__label, .vector-tile-legend__count, .vector-tile-legend__description, .vector-tile-legend__subtitle { font-size: 11px; }
}
</style>
