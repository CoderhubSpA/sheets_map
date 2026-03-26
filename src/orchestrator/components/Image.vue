<template>
    <div class="image-container">
        <img :src="src" :alt="alt" :style="{ width: width }" />
    </div>
</template>
<script>
export default {
    name: 'AppImage',
    props: {
        src: {
            type: String,
            default: '',
        },
        alt: {
            type: String,
            default: '',
        },
        width: {
            type: String,
            default: '100%',
        },
    },
}
</script>
<style lang="scss" scoped>
    .image-container {
        display: flex;
        justify-content: center;
        img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
        }
    }
</style>
