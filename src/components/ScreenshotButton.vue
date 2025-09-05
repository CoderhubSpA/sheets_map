<template>
    <div>
        <b-button @click="showModal" class="screenshot-button">
            <div v-if="loading" class="loader"></div>
            <b-icon v-if="!loading" icon="camera" font-scale="1.5"></b-icon>
        </b-button>
        
        <!-- Modal para título y subtítulo -->
        <b-modal v-model="modalVisible" title="Información de Captura" ok-title="Capturar" cancel-title="Cancelar" @ok="captureMap">
            <b-form>
                <b-form-group label="Título:" label-for="screenshot-title">
                    <b-form-input id="screenshot-title" v-model="screenshotTitle" placeholder="Ingrese un título"></b-form-input>
                </b-form-group>
                <b-form-group label="Subtítulo:" label-for="screenshot-subtitle">
                    <b-form-input id="screenshot-subtitle" v-model="screenshotSubtitle" placeholder="Ingrese un subtítulo"></b-form-input>
                </b-form-group>
            </b-form>
        </b-modal>
    </div>
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
            // Modal y datos de título/subtítulo
            modalVisible: false,
            screenshotTitle: "",
            screenshotSubtitle: "",
        };
    },
    methods: {
        showModal() {
            this.modalVisible = true;
        },
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
                        // Procesar la imagen para agregar título y subtítulo
                        if (vm.screenshotTitle || vm.screenshotSubtitle) {
                            return vm.addTextToImage(dataUrl);
                        }
                        return dataUrl;
                    })
                    .then(function (finalDataUrl) {
                        // Crear enlace de descarga
                        const link = document.createElement("a");
                        const formattedDate = new Date()
                            .toISOString()
                            .slice(0, 10)
                            .replace(/-/g, "");

                        link.download = `${vm.filename}-${formattedDate}.png`;
                        link.href = finalDataUrl;
                        link.click();

                        vm.$emit("captured", link.href);
                        vm.loading = false;
                        vm.modalVisible = false;
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
        
        // Método para agregar título y subtítulo a la imagen
        addTextToImage(dataUrl) {
            return new Promise((resolve, reject) => {
                try {
                    const img = new Image();
                    img.onload = () => {
                        // Crear un canvas con las dimensiones de la imagen original
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        // Dibujar la imagen original en el canvas
                        ctx.drawImage(img, 0, 0);
                        
                        // Calcular dimensiones para el fondo
                            const paddingX = 10;
                            const paddingY = 8;
                            const hasTitle = !!this.screenshotTitle;
                            const hasSubtitle = !!this.screenshotSubtitle;

                            // Texto en mayúsculas
                            const titleText = hasTitle ? this.screenshotTitle.toUpperCase() : "";
                            const subtitleText = hasSubtitle ? this.screenshotSubtitle.toUpperCase() : "";

                            // Medir el ancho de cada línea
                            ctx.font = 'bold 24px Arial';
                            const titleWidth = hasTitle ? ctx.measureText(titleText).width : 0;
                            const titleHeight = hasTitle ? 24 : 0;

                            ctx.font = '18px Arial';
                            const subtitleWidth = hasSubtitle ? ctx.measureText(subtitleText).width : 0;
                            const subtitleHeight = hasSubtitle ? 18 : 0;

                            const textWidth = Math.max(titleWidth, subtitleWidth);
                            const lineSpacing = (hasTitle && hasSubtitle) ? 6 : 0;
                            const textHeight = titleHeight + subtitleHeight + lineSpacing;

                            // Dibujar fondo ajustado al texto con esquinas redondeadas
                            if (textWidth > 0 && textHeight > 0) {
                                const x = 10, y = 10;
                                const w = textWidth + paddingX * 2;
                                const h = textHeight + paddingY * 2;
                                const radius = 12;
                                ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Fondo blanco
                                ctx.beginPath();
                                ctx.moveTo(x + radius, y);
                                ctx.lineTo(x + w - radius, y);
                                ctx.arcTo(x + w, y, x + w, y + radius, radius);
                                ctx.lineTo(x + w, y + h - radius);
                                ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
                                ctx.lineTo(x + radius, y + h);
                                ctx.arcTo(x, y + h, x, y + h - radius, radius);
                                ctx.lineTo(x, y + radius);
                                ctx.arcTo(x, y, x + radius, y, radius);
                                ctx.closePath();
                                ctx.fill();
                            }

                            // Configurar el estilo para el texto
                            ctx.fillStyle = 'black'; // Color del texto
                            ctx.strokeStyle = 'black'; // Borde del texto para mejor legibilidad
                            ctx.lineWidth = 0.5;
                            // Agregar título
                            if (hasTitle) {
                                ctx.font = 'bold 24px Arial';
                                ctx.fillText(titleText, 10 + paddingX, 10 + paddingY + titleHeight);
                                ctx.strokeText(titleText, 10 + paddingX, 10 + paddingY + titleHeight);
                            }

                            // Agregar subtítulo
                            if (hasSubtitle) {
                                ctx.font = '18px Arial';
                                const subY = hasTitle ? (10 + paddingY + titleHeight + lineSpacing + subtitleHeight) : (10 + paddingY + subtitleHeight);
                                ctx.fillText(subtitleText, 10 + paddingX, subY);
                                ctx.strokeText(subtitleText, 10 + paddingX, subY);
                            }

                            // Convertir el canvas a una URL de datos
                            const finalDataUrl = canvas.toDataURL('image/png');
                            resolve(finalDataUrl);
                            this.screenshotTitle = "";
                            this.screenshotSubtitle = "";
                    };
                    
                    img.onerror = (error) => {
                        reject(error);
                    };
                    
                    // Cargar la imagen desde la URL de datos
                    img.src = dataUrl;
                } catch (error) {
                    console.error("Error al agregar texto a la imagen:", error);
                    reject(error);
                }
            });
        }
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

/* Estilos para el modal */
.modal-title {
    font-weight: bold;
    color: var(--sh-map-zoom-button-text-color, #000);
}

.form-group label {
    font-weight: 500;
}
</style>
