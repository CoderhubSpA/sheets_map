<template>
    <div :class="[setPosition ? 'sheets-tooltip-right' : 'sheets-tooltip-left', 'text-white', 'mx-1']" v-if="dataEntries.length > 0">
        <b-icon
            icon="info-circle"
            :id="dataEntries['id']"
            @click="showTooltip = true"
        ></b-icon>
        <div v-if="showTooltip">
            <div :class="[setPosition ? 'sheets-tooltip-right-text' : 'sheets-tooltip-left-text', 'text-white']">
                <div class="text-right">
                    <b-icon
                        icon="x-circle"
                        :id="dataEntries['id']"
                        @click="showTooltip = false"
                        custom-class
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
export default {
    props: {
        data: {
            type: Object,
        }
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
.sheets-tooltip-left {
    svg {
        color: var(--option-active-color);
    }
    .sheets-tooltip-left-text {
        position: absolute;
        top: auto;
        left: 320px;
        z-index: 9999;
        width: 400px;
        padding: 4px;
        border: solid 1px #001D09;
        background-color: var(--subgroup-accordion-color);
        margin-top: -20px;

       &::after {
            content: " ";
            position: absolute;
            top: 7px;
            right: 100%;
            margin-top: -8px;
            border-width: 8px;
            border-style: solid;
            border-color: transparent var(--subgroup-accordion-color) transparent transparent;
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

.sheets-tooltip-right {
    svg {
        color: var(--option-active-color);
    }
    .sheets-tooltip-right-text {
        position: absolute;
        top: auto;
        right: 320px;
        z-index: 9999;
        width: 400px;
        padding: 4px;
        border: solid 1px #001D09;
        background-color: var(--subgroup-accordion-color);
        margin-top: -20px;

        &::after {
            content: " ";
            position: absolute;
            top: 7px;
            left: 100%;
            margin-top: -8px;
            border-width: 8px;
            border-style: solid;
            border-color: transparent transparent transparent var(--subgroup-accordion-color);
        }

       

        a.is-link {
            color: var(--option-active-color);
        }

        @media (max-width: 600px) {
            top: 30%;
            right: 1%;
            left: 1%;
            width: 69%;

            &::after {
                content: " ";
            }
        }
    }
}
</style>