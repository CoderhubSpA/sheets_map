import assert from "node:assert/strict";
import test from "node:test";
import {
    createDownloadOperation,
    isCurrentDownloadOperation,
    retryStageForDownload,
} from "../src/utils/downloadOperation.mjs";

test("a failed operation retains its own layer, URL, and format after selection changes", () => {
    const layerA = { id: "A" };
    const layerB = { id: "B" };
    const operationA = createDownloadOperation({
        kind: "format",
        url: "/wfs/layers/A",
        layerName: "Layer A",
        layer: layerA,
        format: "geopackage",
    });
    const operationB = createDownloadOperation({
        kind: "format",
        url: "/wfs/layers/B",
        layerName: "Layer B",
        layer: layerB,
        format: "csv",
    });

    assert.equal(operationA.url, "/wfs/layers/A");
    assert.equal(operationA.layerName, "Layer A");
    assert.equal(operationA.layer, layerA);
    assert.equal(operationA.format, "geopackage");
    assert.equal(isCurrentDownloadOperation(operationB, operationA), false);
});

test("retry stage distinguishes capability discovery from a selected format", () => {
    const discovery = createDownloadOperation({
        kind: "discovery",
        url: "/wfs/layers/A",
        layerName: "Layer A",
    });
    const formatted = createDownloadOperation({
        kind: "format",
        url: "/wfs/layers/A",
        layerName: "Layer A",
        format: "geopackage",
    });
    const direct = createDownloadOperation({
        kind: "direct",
        url: "/files/layer.gpkg",
        layerName: "Layer A",
        layer: null,
    });

    assert.equal(retryStageForDownload(discovery), "capabilities");
    assert.equal(retryStageForDownload(direct), "direct");
    assert.equal(retryStageForDownload(formatted), "format");
    assert.equal(retryStageForDownload(null), null);
});
