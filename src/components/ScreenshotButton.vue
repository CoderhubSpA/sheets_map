<template>
    <b-button @click="captureMap" class="screenshot-button">
        <b-icon icon="camera" font-scale="1.5"></b-icon>
    </b-button>
</template>
  
  <script>
// import html2canvas from "html2canvas";
import domtoimage from "dom-to-image";

export default {
    name: "ScreenshotButton",
    props: {
        // ID del elemento a capturar (requerido)
        targetId: {
            type: String,
            required: true,
        },
        // Nombre del archivo para descarga (opcional)
        filename: {
            type: String,
            default: "sheets-map-screenshot",
        },
        // Tipo de imagen (opcional)
        imageType: {
            type: String,
            default: "png",
            validator: (value) => ["png", "jpeg", "webp"].includes(value),
        },
        // Calidad de imagen (solo para jpeg/webp)
        quality: {
            type: Number,
            default: 0.92,
            validator: (value) => value >= 0 && value <= 1,
        },
    },
    methods: {
        async captureMap() {
            await this.$nextTick();

            const vm = this;

            try {
                const targetElement = document.getElementById(this.targetId);

                if (!targetElement) {
                    throw new Error(
                        `Elemento con ID '${this.targetId}' no encontrado`
                    );
                }

                // Mostrar feedback visual durante la captura
                targetElement.classList.add("screenshot-capturing");

                domtoimage.toPng(targetElement, {
                    quality: vm.quality
                }).then(function (dataUrl) {
                    // // Crear enlace de descarga
                    const link = document.createElement("a");
                    const formattedDate = new Date()
                        .toISOString()
                        .slice(0, 10)
                        .replace(/-/g, "");

                    link.download = `${vm.filename}-${formattedDate}.${vm.imageType}`;
                    link.href = dataUrl;
                    link.click();

                    vm.$emit("captured", link.href);
                }).catch(function (error) {
                    vm.$emit("error", error);

                    return Promise.reject(error);
                });
            } catch (error) {
                console.error("Error al capturar screenshot:", error);
                vm.$emit("error", error);
            } finally {
                const targetElement = document.getElementById(vm.targetId);

                if (targetElement) {
                    targetElement.classList.remove("screenshot-capturing");
                }
            }
        },
    },
};
</script>
  
  <style scoped>
.screenshot-button {
    background-color: var(--sh-map-zoom-button-background-color);
    color: var(--sh-map-zoom-button-text-color);
    border-radius: var(--sh-map-radius-multiplier);
    display: flex;
    justify-content: center;
    align-items: center;
    --size: 36px;
    width: var(--size);
    height: var(--size);
    padding: 0;
    border: none;
    font-size: 0.7rem;
}

.screenshot-capturing {
    transition: box-shadow 0.3s;
    box-shadow: 0 0 0 3px var(--sh-map-zoom-button-background-color);
}
</style>
  
