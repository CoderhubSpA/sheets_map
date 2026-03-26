<template>
    <div class="section" :class="[{ 'redirection': redirect }]" :style="customColor" @click="handleClick">
        <div class="section-icon">
            <b-icon :icon="icon" font-scale="1.5"></b-icon>
        </div>
        <div class="section-name">{{ name }}</div>
    </div>
</template>
<script>

export default {
    props: {
        icon: {
            type: String,
            default: 'map',
        },
        name: {
            type: String,
            default: '',
        },
        color: {
            type: String,
            default: null,
        },
        redirect: {
            type: String,
            default: null,
        },
    },
    computed: {
        customColor() {
            return this.color ? { 
                color: this.color,
                backgroundColor: this.color + '15',
                '--section-icon': this.color,
            } : {};
        },
    },
    methods: {
        handleClick(event) {
            this.$emit('click', event)

            if (this.redirect) {
                window.location.href = this.redirect;
            }
        },
    },
}
</script>
<style lang="scss">
.section {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    padding: 6px 10px;
    color: var(--secondary-color);
    background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
    border-radius: 30px;
    .section-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        margin-right: 10px;
        color: inherit;
        border-radius: 50%;
    }
    .section-name {
        display: flex;
        justify-content: center;
        align-items: center;
        color: inherit;
        font-size: 1rem;
        font-weight: var(--font-weight-medium);
    }

    &.redirection {
        &:hover {
            filter: brightness(0.95);
        }
        &:active {
            transform: scale(0.98);
        }
        .section-name {
            font-weight: 800;
        }
        cursor: pointer;
    }
}
</style>
