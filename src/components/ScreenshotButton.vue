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
import html2canvas from "html2canvas";


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
            const targetElement = document.getElementById(this.targetId);

            vm.loading = true;


            try {
                if (!targetElement) {
                    throw new Error(
                        `Elemento con ID '${this.targetId}' no encontrado`
                    );
                }

                // Mostrar feedback visual durante la captura
                targetElement.classList.add("screenshot-capturing");

                // --- Workaround para transformaciones de Leaflet ---
                // Aplanar la transformación de los paneles que contienen contenido visual.
                const panes = targetElement.querySelectorAll('.leaflet-tile-pane, .leaflet-marker-pane, .leaflet-overlay-pane > svg');
                
                // Guardar transformaciones originales
                const originalTransforms = Array.from(panes).map(p => p.style.transform);

                // Aplanar la transformación de cada panel
                panes.forEach(pane => {
                    const computedTransform = window.getComputedStyle(pane).transform;
                    if (computedTransform && computedTransform !== 'none') {
                        const matrix = new DOMMatrix(computedTransform);
                        pane.style.transform = `translate(${matrix.e}px, ${matrix.f}px)`;
                    }
                });

                const scale = window.devicePixelRatio || 1;

                html2canvas(targetElement, {
                        useCORS: true, // Similar a cacheBust
                        ignoreElements: (element) => {
                            return (
                                (element.classList &&
                                    element.classList.contains("custom-controls")) ||
                                // Excluir el SVG de los controles de zoom, pero no las capas SVG
                                (element.tagName === "svg" &&
                                    element.classList.contains("leaflet-control-zoom"))
                            );
                        },
                        scale: scale, // Aumentar la resolución para pantallas HiDPI
                    })
                    .then((canvas) => {
                        return canvas.toDataURL("image/png", vm.quality);
                    })
                    .then(function (dataUrl) {
                        // Procesar la imagen para agregar título y subtítulo
                        if (vm.screenshotTitle || vm.screenshotSubtitle) {
                            return vm.addTextToImage(dataUrl, scale);
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
                        vm.$emit("error", error)
                        return Promise.reject(error);
                    })
                    .finally(() => {
                        vm.loading = false;
                        // Restaurar siempre las transformaciones originales
                        panes.forEach((pane, index) => {
                            pane.style.transform = originalTransforms[index];
                        });
                        targetElement.classList.remove("screenshot-capturing");
                    });
            } catch (error) {
                console.error("Error al capturar screenshot:", error);
                vm.$emit("error", error);
            } finally {
                // La limpieza final se hace en el .finally() de la promesa de html2canvas
            }
        },
        
        // Método para agregar título y subtítulo a la imagen
        addTextToImage(dataUrl, scale = 1) {
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
                            const paddingX = 10 * scale;
                            const paddingY = 8 * scale;
                            const hasTitle = !!this.screenshotTitle;
                            const hasSubtitle = !!this.screenshotSubtitle;

                            // Texto en mayúsculas
                            const titleText = hasTitle ? this.screenshotTitle.toUpperCase() : "";
                            const subtitleText = hasSubtitle ? this.screenshotSubtitle.toUpperCase() : "";

                            // Medir el ancho de cada línea
                            ctx.font = `bold ${24 * scale}px Arial`;
                            const titleWidth = hasTitle ? ctx.measureText(titleText).width : 0;
                            const titleHeight = hasTitle ? (24 * scale) : 0;

                            ctx.font = `${18 * scale}px Arial`;
                            const subtitleWidth = hasSubtitle ? ctx.measureText(subtitleText).width : 0;
                            const subtitleHeight = hasSubtitle ? (18 * scale) : 0;

                            const textWidth = Math.max(titleWidth, subtitleWidth);
                            const lineSpacing = (hasTitle && hasSubtitle) ? (6 * scale) : 0;
                            const textHeight = titleHeight + subtitleHeight + lineSpacing;

                            // Dibujar fondo ajustado al texto con esquinas redondeadas
                            if (textWidth > 0 && textHeight > 0) {
                                const x = 10 * scale, y = 10 * scale;
                                const w = textWidth + paddingX * 2;
                                const h = textHeight + paddingY * 2;
                                const radius = 12 * scale;
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
                            ctx.lineWidth = 0.5 * scale;
                            // Agregar título
                            if (hasTitle) {
                                ctx.font = `bold ${24 * scale}px Arial`;
                                ctx.fillText(titleText, (10 * scale) + paddingX, (10 * scale) + paddingY + titleHeight);
                                ctx.strokeText(titleText, (10 * scale) + paddingX, (10 * scale) + paddingY + titleHeight);
                            }

                            // Agregar subtítulo
                            if (hasSubtitle) {
                                ctx.font = `${18 * scale}px Arial`;
                                const subY = hasTitle ? ((10 * scale) + paddingY + titleHeight + lineSpacing + subtitleHeight) : ((10 * scale) + paddingY + subtitleHeight);
                                ctx.fillText(subtitleText, (10 * scale) + paddingX, subY);
                                ctx.strokeText(subtitleText, (10 * scale) + paddingX, subY);
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
