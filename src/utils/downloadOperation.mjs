export function createDownloadOperation({ kind, url, layerName, layer, format = null }) {
    return Object.freeze({ kind, url, layerName, layer, format });
}

export function isCurrentDownloadOperation(activeOperation, operation) {
    return activeOperation === operation;
}

export function retryStageForDownload(operation) {
    if (operation?.kind === "discovery") return "capabilities";
    if (operation?.kind === "direct") return "direct";
    if (operation?.kind === "format") return "format";
    return null;
}
