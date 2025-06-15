<template>
    <b-button @click="captureMap" class="screenshot-button">
        <div v-if="loading" class="loader"></div>
        <b-icon v-if="!loading" icon="camera" font-scale="1.5"></b-icon>
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
        // Calidad de imagen (solo para jpeg/webp)
        quality: {
            type: Number,
            default: 0.92,
            validator: (value) => value >= 0 && value <= 1,
        },
    },
    data() {
        return {
            // Estado de carga (opcional)
            loading: false,
        };
    },
    methods: {
        async captureMap() {
            await this.$nextTick();

            const vm = this;

            vm.loading = true;

            try {
                const targetElement = document.getElementById(this.targetId);

                if (!targetElement) {
                    throw new Error(
                        `Elemento con ID '${this.targetId}' no encontrado`
                    );
                }

                // Mostrar feedback visual durante la captura
                targetElement.classList.add("screenshot-capturing");

                domtoimage
                    .toPng(targetElement, {
                        filter: (node) => {
                            // Excluir elementos problemáticos
                            if (
                                node.classList &&
                                node.classList.contains("custom-controls")
                            ) {
                                return false;
                            }

                            // Excluir elementos SVG
                            if (node.tagName === "svg") {
                                return false;
                            }

                            return true;
                        },
                        style: {
                            transform: "none", // Eliminar transformaciones problemáticas
                            "will-change": "auto",
                        },
                        quality: vm.quality,
                        cacheBust: true,
                    })
                    .then(function (dataUrl) {
                        // // Crear enlace de descarga
                        const link = document.createElement("a");
                        const formattedDate = new Date()
                            .toISOString()
                            .slice(0, 10)
                            .replace(/-/g, "");

                        link.download = `${vm.filename}-${formattedDate}.png`;
                        link.href = dataUrl;
                        link.click();

                        vm.$emit("captured", link.href);
                        vm.loading = false;
                    })
                    .catch(function (error) {
                        vm.$emit("error", error);

                        return Promise.reject(error);
                    })
                    .finally(() => {
                        vm.loading = false;
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
    box-shadow: 0 0 0 3px var(--sh-map-zoom-button-text-color);
}

.loader {
    width: 20px;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 4px solid var(--sh-map-zoom-button-text-color);
    border-right-color: var(--sh-map-zoom-button-background-color);
    animation: l2 1s infinite linear;
}
@keyframes l2 {
    to {
        transform: rotate(1turn);
    }
}
</style>
