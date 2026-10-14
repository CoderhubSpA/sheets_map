import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
    new URL("../src/components/PolygonDrafter.vue", import.meta.url),
    "utf8",
);
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^import .*;\r?$/gm, "")
    .replace("export default", "return");

function createDrafter() {
    const ticks = [];
    const timers = [];
    const listeners = new Map();
    const state = { active: null, options: {}, removal: false };
    const emit = (name, event) => {
        for (const listener of listeners.get(name) || []) listener(event);
    };
    const pm = {
        setLang() {},
        enableDraw(shape, options) {
            this.disableDraw();
            state.active = shape;
            state.options = options;
        },
        disableDraw() {
            const shape = state.active;
            state.active = null;
            if (shape) emit("pm:drawend", { shape });
        },
        disableGlobalRemovalMode() { state.removal = false; },
        toggleGlobalRemovalMode() { state.removal = !state.removal; },
    };
    const component = new Function("LGeoJson", "LCircleMarker", "L", "setTimeout", script)(
        {}, {},
        { PM: { setOptIn() {}, reInitLayer() {}, Utils: { circleToPolygon: (layer) => layer } } },
        (callback) => timers.push(callback),
    );
    const drafter = {
        ...component.data(),
        map: {
            pm,
            eachLayer() {},
            getContainer: () => ({ style: {} }),
            on(name, listener) {
                if (!listeners.has(name)) listeners.set(name, []);
                listeners.get(name).push(listener);
            },
        },
        style_variables: {},
        info: { columns: [] },
        $emit() {},
        $nextTick: (callback) => ticks.push(callback),
    };
    for (const [name, method] of Object.entries(component.methods)) {
        drafter[name] = method.bind(drafter);
    }
    for (const [name, getter] of Object.entries(component.computed)) {
        Object.defineProperty(drafter, name, { get: getter.bind(drafter) });
    }
    drafter.initializePm();

    function settle() {
        let remaining = 20;
        while (ticks.length || timers.length) {
            assert.ok(remaining-- > 0, "Drawing callbacks must settle without re-entry");
            (ticks.shift() || timers.shift())();
        }
    }

    function complete() {
        const shape = state.active;
        assert.ok(shape, "A drawing tool must be active");
        const layer = {
            options: {},
            on() {},
            toGeoJSON: () => ({ properties: {}, geometry: { coordinates: [[]] } }),
        };
        emit("pm:create", { shape, layer });
        const options = state.options;
        pm.disableDraw();
        // Geoman completes the geometry, then restarts the same native draw instance.
        if (options.continueDrawing) state.active = shape;
        settle();
    }

    return { drafter, state, complete, settle };
}

for (const [tool, shape] of [["polygon", "Polygon"], ["circle", "Circle"], ["rectangle", "Rectangle"]]) {
    test(`switches to ${tool} after a completed polygon without reactivating the old tool`, () => {
        const { drafter, state, complete, settle } = createDrafter();
        drafter.beginDraw("polygon");
        complete();
        assert.equal(state.active, "Polygon");

        drafter.beginDraw(tool);
        settle();
        assert.equal(state.active, shape);

        complete();
        assert.equal(state.active, shape, "Continuous drawing must remain available");
        assert.equal(drafter.layers.length, 2);
    });
}

test("cancelling a completed polygon cannot reactivate it over a newly selected circle", () => {
    const { drafter, state, complete, settle } = createDrafter();
    drafter.beginDraw("polygon");
    complete();
    drafter.cancelDraw();
    assert.equal(state.active, null);
    assert.equal(drafter.drawing, false);

    drafter.beginDraw("circle");
    settle();
    assert.equal(state.active, "Circle");
});

test("eraser pauses drawing and defers resuming the selected tool until after the removal click", () => {
    const { drafter, state, complete, settle } = createDrafter();
    drafter.beginDraw("polygon");
    complete();
    drafter.beginDraw("circle");
    settle();
    drafter.toggleDelete();
    settle();
    assert.equal(state.active, null);
    assert.equal(state.removal, true);
    assert.equal(drafter.drawing, false);

    drafter.toggleDelete();
    assert.equal(state.active, null, "The eraser click must not start a geometry");
    settle();
    assert.equal(state.active, "Circle");
    assert.equal(state.removal, false);
});

test("cancelling while eraser resume is queued keeps drawing disabled", () => {
    const { drafter, state, settle } = createDrafter();
    drafter.beginDraw("polygon");
    drafter.toggleDelete();
    drafter.toggleDelete();
    drafter.cancelDraw();
    settle();
    assert.equal(state.active, null);
    assert.equal(drafter.drawing, false);
});
