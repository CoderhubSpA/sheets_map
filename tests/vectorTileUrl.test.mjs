import assert from "node:assert/strict";
import test from "node:test";
import { buildFilteredVectorTileUrl, buildLabeledVectorTileUrl } from "../src/utils/vectorTileUrl.js";

const TILE_TEMPLATE = "https://gis.test/vector/tiles/macrozonas/{z}/{x}/{y}.pbf";

test("leaves the tile URL untouched when labels are not enabled", () => {
    assert.equal(buildLabeledVectorTileUrl(TILE_TEMPLATE, false), TILE_TEMPLATE);
});

test("adds the labels parameter to a URL without query string", () => {
    assert.equal(buildLabeledVectorTileUrl(TILE_TEMPLATE, true), `${TILE_TEMPLATE}?labels=true`);
});

test("appends the labels parameter after an existing filter", () => {
    const filtered = buildFilteredVectorTileUrl(TILE_TEMPLATE, "macrozona", "TALCA");
    assert.equal(buildLabeledVectorTileUrl(filtered, true), `${filtered}&labels=true`);
});

test("returns empty URLs as they are", () => {
    assert.equal(buildLabeledVectorTileUrl("", true), "");
});
