<template>
    <div class="sheets-tooltip mx-1" v-if="dataEntries.length > 0">
        <b-icon
            icon="info-circle"
            :id="dataEntries['id']"
            @click="hiddenShowTooltip()"
            custom-class="open-tooltip"
        ></b-icon>
        <div v-show="showTooltip">
            <div :class="[setPosition ? 'sheets-tooltip-right-text' : 'sheets-tooltip-left-text', 'text-white', 'sheets-tooltip-text']" :ref="layerKey">
                <div class="text-right">
                    <b-icon
                        icon="x-circle"
                        :id="dataEntries['id']"
                        @click="showTooltip = false"
                        custom-class="close-tooltip"
                    ></b-icon>
                </div>
                <div>
                    <p v-for="data in dataEntries" :key="data[0]" class="mb-0 text-justify">
                        <span style="text-transform: capitalize"><b>{{ data[0] }}: </b></span>
                        <span v-if="isLink(data[1])"><a :href="data[1]" target="_blank" rel="noopener noreferrer" class="is-link">Click aquí</a></span>
                        <span v-else>{{ data[1] }}</span>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { BIcon } from 'bootstrap-vue';

export default {
    components: {
        BIcon
    },
    props: {
        data: {
            type: Object,
            require: true
        },
        layerKey: {
            type: String,
            require: true
        },
    },
    data: () => {
        return {
            showTooltip: false,
        };
    },
    computed: {
        dataEntries() {
            if(this.data) {
                const data = Object.entries(this.data);
                return data;
            }

            return [];
        },
        setPosition(){
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
            const parentPosition = this.$parent.$refs.dropdown.getBoundingClientRect().left;
   
            return parentPosition > (vw / 2);
        }
    },
    methods: {
        hiddenShowTooltip() {
            this.showTooltip = !this.showTooltip;

            const containerScrolled = document.getElementById('dropdown_base_layers');
            const scrollDistance = containerScrolled.scrollTop;

            if(this.$refs[this.layerKey]) {
                this.$refs[this.layerKey].style.marginTop = '-' + (scrollDistance + 28) + 'px';
            }

        },
        isLink(value) {
            if (value && typeof value === 'string') {
                if (value.substring(0, 4) === 'http' || value.substring(0, 5) === 'https') {
                    return true;
                }
            }

            return false;
        }
    },
};
</script>

<style scoped lang="scss">
.sheets-tooltip {
    svg {
        color: var(--option-active-color);
    }
    .sheets-tooltip-text {
        position: absolute;
        z-index: 9999;
        width: 400px;
        padding: calc((var(--global-radius) / 2) + 4px);
        background-color: var(--subgroup-accordion-color);
        border-radius: var(--global-radius);
        svg {
            color: var(--subgroup-accordion-text-color);
        }
       &::after {
            content: " ";
            position: absolute;
            top: calc(var(--global-radius) + 7px);
            margin-top: -8px;
            border-width: 8px;
            border-style: solid;
            border-color: transparent var(--subgroup-accordion-color) transparent transparent;
        }
        &.sheets-tooltip-right-text {
            right: 100%;
            &::after {
                left: 100%;
                border-color: transparent transparent transparent var(--subgroup-accordion-color);
            }
        }
        &.sheets-tooltip-left-text {
            left: 100%;
            &::after {
                right: 100%;
                border-color: transparent var(--subgroup-accordion-color) transparent transparent;
            }
        }
        

        a.is-link {
            color: var(--option-active-color);
        }

        @media (max-width: 600px) {
            top: auto;
            left: 1%;
            width: 69%;
            margin-top: -22px;

            &::after {
                border-style: none;
            }
            
        }
    }
}

</style>
