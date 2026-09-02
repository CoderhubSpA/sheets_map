import assert from "node:assert/strict";
import test from "node:test";
import {
    filenameFromContentDisposition,
    resolveDownloadFilename,
} from "../src/utils/downloadFilename.mjs";

test("prefers and decodes the RFC 5987 server filename", () => {
    assert.equal(
        filenameFromContentDisposition(
            "attachment; filename*=UTF-8''protected%20areas.geojson",
        ),
        "protected areas.geojson",
    );
});

test("removes path traversal and unsafe filename characters", () => {
    assert.equal(
        filenameFromContentDisposition('attachment; filename="../exports/map?.zip"'),
        "map_.zip",
    );
});

test("uses the server filename before local fallbacks", () => {
    assert.equal(resolveDownloadFilename({
        headers: {
            get: (name) => name === "content-disposition"
                ? 'attachment; filename="server-data.gpkg"'
                : null,
        },
        contentType: "application/octet-stream",
        fallbackName: "Visible layer",
        fallbackExtension: "zip",
        url: "https://gis.test/export",
    }), "server-data.gpkg");
});

test("derives a safe extension from format, MIME type, or URL", () => {
    assert.equal(resolveDownloadFilename({
        fallbackName: "Visible layer",
        fallbackExtension: ".zip",
    }), "Visible layer.zip");
    assert.equal(resolveDownloadFilename({
        contentType: "application/geo+json; charset=utf-8",
        fallbackName: "Visible layer",
    }), "Visible layer.geojson");
    assert.equal(resolveDownloadFilename({
        fallbackName: "Visible layer",
        url: "https://gis.test/files/export.zip?download=1",
    }), "Visible layer.zip");
});
