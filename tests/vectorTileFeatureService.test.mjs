import assert from "node:assert/strict";
import test from "node:test";
import { buildVectorTileFeatureUrl } from "../src/services/vectorTileFeatureService.js";

globalThis.window = { location: { origin: "https://gis.test" } };

const TILE_TEMPLATE = "https://gis.test/vector/tiles/macrozonas/{z}/{x}/{y}.pbf";

test("derives the feature URL from an absolute tile template", () => {
    assert.equal(
        buildVectorTileFeatureUrl(TILE_TEMPLATE, "macrozonas", 7),
        "https://gis.test/vector/layers/macrozonas/features/7",
    );
});

test("keeps relative tile URLs relative", () => {
    assert.equal(
        buildVectorTileFeatureUrl("/vector/tiles/macrozonas/{z}/{x}/{y}.pbf", "macrozonas", 7),
        "/vector/layers/macrozonas/features/7",
    );
});

test("supports tile URLs without the z/x/y suffix and drops the tile query string", () => {
    assert.equal(
        buildVectorTileFeatureUrl("https://gis.test/vector/tiles/macrozonas?attributes=id", "macrozonas", 7),
        "https://gis.test/vector/layers/macrozonas/features/7",
    );
});

test("adds idProperty only when it differs from the default", () => {
    assert.equal(
        buildVectorTileFeatureUrl(TILE_TEMPLATE, "macrozonas", "R01", "codigo"),
        "https://gis.test/vector/layers/macrozonas/features/R01?idProperty=codigo",
    );
    assert.equal(
        buildVectorTileFeatureUrl(TILE_TEMPLATE, "macrozonas", 7, "id"),
        "https://gis.test/vector/layers/macrozonas/features/7",
    );
});

test("encodes the layer name and the identifier", () => {
    assert.equal(
        buildVectorTileFeatureUrl(TILE_TEMPLATE, "macro zonas", "a/b?c"),
        "https://gis.test/vector/layers/macro%20zonas/features/a%2Fb%3Fc",
    );
});

test("returns null when the URL cannot be derived", () => {
    assert.equal(buildVectorTileFeatureUrl("https://gis.test/other/path", "macrozonas", 7), null);
    assert.equal(buildVectorTileFeatureUrl(TILE_TEMPLATE, "", 7), null);
    assert.equal(buildVectorTileFeatureUrl(TILE_TEMPLATE, "macrozonas", null), null);
    assert.equal(buildVectorTileFeatureUrl(TILE_TEMPLATE, "macrozonas", ""), null);
    assert.equal(buildVectorTileFeatureUrl("", "macrozonas", 7), null);
});
