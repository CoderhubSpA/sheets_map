import assert from "node:assert/strict";
import test from "node:test";

import { createMapLibreAuthRecoveryController } from "../src/utils/mapLibreAuthRecovery.mjs";

const TILE_TEMPLATE = "https://gis.test/vector/tiles/places/{z}/{x}/{y}.pbf";

function tileRequest(token, url = "https://gis.test/vector/tiles/places/1/0/0.pbf") {
    return {
        url,
        headers: { Authorization: `Bearer ${token}` },
    };
}

function authError(url, sourceId = "vector-tiles") {
    return {
        sourceId,
        error: { status: 401, url },
    };
}

test("correlates MapLibre tile failures by token generation without exposing tokens", () => {
    const controller = createMapLibreAuthRecoveryController({ sourceId: "vector-tiles" });
    const first = controller.rememberRequest(
        TILE_TEMPLATE,
        "Tile",
        tileRequest("secret-token"),
    );
    const second = controller.rememberRequest(
        TILE_TEMPLATE,
        "Tile",
        tileRequest("secret-token", "https://gis.test/vector/tiles/places/1/1/0.pbf"),
    );
    const glyph = tileRequest("secret-token", "https://fonts.test/glyph.pbf");

    assert.match(first.url, /_sheets_auth_token=1$/);
    assert.match(second.url, /_sheets_auth_token=1$/);
    assert.doesNotMatch(first.url, /secret-token/);
    assert.equal(controller.rememberRequest(glyph.url, "Glyphs", glyph), glyph);
    assert.equal(controller.decorateSourceUrl(TILE_TEMPLATE), TILE_TEMPLATE);
});

test("coalesces one recovery per rejected token and rearms for the next token", async () => {
    let token = "token-a";
    let invalidations = 0;
    const requestAuth = {
        getHeaders: async () => ({ Authorization: `Bearer ${token}` }),
        peekHeaders: () => ({ Authorization: `Bearer ${token}` }),
        isTrustedUrl: () => true,
        invalidate: (rejectedToken) => {
            invalidations += 1;
            if (rejectedToken === token) {
                token = token === "token-a" ? "token-b" : "token-c";
            }
        },
    };
    const tileUpdates = [];
    const map = {
        getSource: () => ({ setTiles: (tiles) => tileUpdates.push(tiles) }),
    };
    const controller = createMapLibreAuthRecoveryController({ sourceId: "vector-tiles" });
    const recoveryOptions = (event) => ({
        event,
        requestAuth,
        requestUrl: () => TILE_TEMPLATE,
        getMap: () => map,
    });

    const firstRequest = controller.rememberRequest(
        TILE_TEMPLATE,
        "Tile",
        tileRequest("token-a"),
    );
    const firstRecovery = controller.recover(recoveryOptions(authError(firstRequest.url)));
    const duplicateRecovery = controller.recover(recoveryOptions(authError(firstRequest.url)));
    assert.equal(firstRecovery, duplicateRecovery);
    assert.deepEqual(await Promise.all([firstRecovery, duplicateRecovery]), [true, true]);
    assert.equal(invalidations, 1);
    assert.deepEqual(tileUpdates, [[`${TILE_TEMPLATE}?_sheets_auth_retry=1`]]);

    const secondRequest = controller.rememberRequest(
        TILE_TEMPLATE,
        "Tile",
        tileRequest("token-b"),
    );
    assert.equal(await controller.recover(recoveryOptions(authError(secondRequest.url))), true);
    assert.equal(invalidations, 2);
    assert.deepEqual(tileUpdates[1], [`${TILE_TEMPLATE}?_sheets_auth_retry=2`]);
});

test("reset rejects stale generations and prevents in-flight map mutation", async () => {
    let token = "token-a";
    let releaseInvalidation;
    let invalidationStarted;
    const started = new Promise((resolve) => { invalidationStarted = resolve; });
    const blocked = new Promise((resolve) => { releaseInvalidation = resolve; });
    const requestAuth = {
        getHeaders: async () => ({ Authorization: `Bearer ${token}` }),
        peekHeaders: () => ({ Authorization: `Bearer ${token}` }),
        isTrustedUrl: () => true,
        invalidate: async () => {
            invalidationStarted();
            await blocked;
            token = "token-b";
        },
    };
    const tileUpdates = [];
    const map = {
        getSource: () => ({ setTiles: (tiles) => tileUpdates.push(tiles) }),
    };
    const controller = createMapLibreAuthRecoveryController({ sourceId: "vector-tiles" });
    const oldRequest = controller.rememberRequest(
        TILE_TEMPLATE,
        "Tile",
        tileRequest("token-a"),
    );
    const pending = controller.recover({
        event: authError(oldRequest.url),
        requestAuth,
        requestUrl: TILE_TEMPLATE,
        getMap: () => map,
    });

    await started;
    controller.reset();
    releaseInvalidation();
    assert.equal(await pending, false);
    assert.deepEqual(tileUpdates, []);

    const newRequest = controller.rememberRequest(
        TILE_TEMPLATE,
        "Tile",
        tileRequest("token-b"),
    );
    assert.match(newRequest.url, /_sheets_auth_token=2$/);
    assert.equal(await controller.recover({
        event: authError(oldRequest.url),
        requestAuth,
        requestUrl: TILE_TEMPLATE,
        getMap: () => map,
    }), false);
});

test("an old recovery cannot delete a newer recovery for the same token", async () => {
    let releaseOldInvalidation;
    let signalOldInvalidation;
    const oldInvalidationStarted = new Promise((resolve) => { signalOldInvalidation = resolve; });
    const oldInvalidationBlocked = new Promise((resolve) => { releaseOldInvalidation = resolve; });
    const oldAuth = {
        getHeaders: async () => ({ Authorization: "Bearer token-a" }),
        peekHeaders: () => ({ Authorization: "Bearer token-a" }),
        isTrustedUrl: () => true,
        invalidate: async () => {
            signalOldInvalidation();
            await oldInvalidationBlocked;
            throw new Error("stale recovery");
        },
    };
    let newToken = "token-a";
    let newInvalidations = 0;
    let releaseNewInvalidation;
    let signalNewInvalidation;
    const newInvalidationStarted = new Promise((resolve) => { signalNewInvalidation = resolve; });
    const newInvalidationBlocked = new Promise((resolve) => { releaseNewInvalidation = resolve; });
    const newAuth = {
        getHeaders: async () => ({ Authorization: `Bearer ${newToken}` }),
        peekHeaders: () => ({ Authorization: `Bearer ${newToken}` }),
        isTrustedUrl: () => true,
        invalidate: async () => {
            newInvalidations += 1;
            signalNewInvalidation();
            await newInvalidationBlocked;
            newToken = "token-b";
        },
    };
    const tileUpdates = [];
    const map = {
        getSource: () => ({ setTiles: (tiles) => tileUpdates.push(tiles) }),
    };
    const controller = createMapLibreAuthRecoveryController({ sourceId: "vector-tiles" });
    const oldRequest = controller.rememberRequest(
        TILE_TEMPLATE,
        "Tile",
        tileRequest("token-a"),
    );
    const oldRecovery = controller.recover({
        event: authError(oldRequest.url),
        requestAuth: oldAuth,
        requestUrl: TILE_TEMPLATE,
        getMap: () => map,
    });

    await oldInvalidationStarted;
    controller.reset();
    const newRequest = controller.rememberRequest(
        TILE_TEMPLATE,
        "Tile",
        tileRequest("token-a"),
    );
    const newOptions = {
        event: authError(newRequest.url),
        requestAuth: newAuth,
        requestUrl: TILE_TEMPLATE,
        getMap: () => map,
    };
    const newRecovery = controller.recover(newOptions);
    await newInvalidationStarted;

    releaseOldInvalidation();
    assert.equal(await oldRecovery, false);
    assert.equal(controller.recover(newOptions), newRecovery);
    releaseNewInvalidation();
    assert.equal(await newRecovery, true);
    assert.equal(newInvalidations, 1);
    assert.equal(tileUpdates.length, 1);
});

test("reports one failed refresh and suppresses later errors for the same token", async () => {
    const token = "token-a";
    let errors = 0;
    let invalidations = 0;
    const requestAuth = {
        getHeaders: async () => ({ Authorization: `Bearer ${token}` }),
        peekHeaders: () => ({ Authorization: `Bearer ${token}` }),
        isTrustedUrl: () => true,
        invalidate: () => {
            invalidations += 1;
            return false;
        },
    };
    const tileUpdates = [];
    const map = {
        getSource: () => ({ setTiles: (tiles) => tileUpdates.push(tiles) }),
    };
    const controller = createMapLibreAuthRecoveryController({ sourceId: "vector-tiles" });
    const request = controller.rememberRequest(
        TILE_TEMPLATE,
        "Tile",
        tileRequest("token-a"),
    );
    const options = {
        event: authError(request.url),
        requestAuth,
        requestUrl: TILE_TEMPLATE,
        getMap: () => map,
        onError: () => { errors += 1; },
    };

    assert.equal(await controller.recover(options), false);
    assert.equal(errors, 1);
    assert.equal(invalidations, 1);
    assert.equal(await controller.recover(options), false);
    assert.equal(errors, 1);
    assert.equal(invalidations, 1);
    assert.equal(tileUpdates.length, 0);
});
