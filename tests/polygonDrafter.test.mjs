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
const mapSource = readFileSync(new URL("../src/components/SheetsMap.vue", import.meta.url), "utf8");
const actionMethod = mapSource.match(/^ {8}polygonAction\([^\n]+\) \{[\s\S]*?^ {8}\},/m)[0];
const polygonAction = new Function(`return function ${actionMethod.slice(0, -1)}`)();

function createDrafter(popupLayer = null) {
    const ticks = [];
    const timers = [];
    const listeners = new Map();
    const state = { active: null, options: {}, removal: false, vertices: 0 };
    const emit = (name, event) => {
        for (const listener of listeners.get(name) || []) listener(event);
    };
    const pm = {
        setLang() {},
        enableDraw(shape, options) {
            this.disableDraw();
            state.active = shape;
            state.options = options;
            state.vertices = 0;
        },
        disableDraw() {
            const shape = state.active;
            state.active = null;
            state.vertices = 0;
            if (shape) emit("pm:drawend", { shape });
        },
        disableGlobalRemovalMode() { state.removal = false; },
        enableGlobalRemovalMode() { state.removal = true; },
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
            eachLayer(callback) { if (popupLayer) callback(popupLayer); },
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
            toGeoJSON: () => ({ properties: {}, geometry: {
                type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
            } }),
        };
        emit("pm:create", { shape, layer });
        const options = state.options;
        pm.disableDraw();
        // Geoman completes the geometry, then restarts the same native draw instance.
        if (options.continueDrawing) state.active = shape;
        settle();
        return layer;
    }

    return {
        drafter, state, complete, settle,
        click: () => { if (state.active) state.vertices += 1; },
        action: (tool, toggle = false) => polygonAction.call(
            { $refs: { polygon_drafter: drafter } }, tool, toggle,
        ),
    };
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

test("eraser clears the selected drawing tool and does not restart it when deselected", () => {
    const { drafter, state, complete, settle, click } = createDrafter();
    drafter.beginDraw("polygon");
    complete();
    drafter.beginDraw("circle");
    settle();
    drafter.toggleDelete();
    settle();
    assert.equal(state.active, null);
    assert.equal(state.removal, true);
    assert.equal(drafter.drawing, false);
    assert.equal(drafter.buttons_pressed.circle, false);
    assert.equal(drafter.buttons_pressed.delete, true);

    drafter.toggleDelete();
    settle();
    click();
    assert.equal(state.active, null);
    assert.equal(state.vertices, 0, "Leaving eraser mode must not accept drawing vertices");
    assert.equal(state.removal, false);
    assert.equal(drafter.buttons_pressed.delete, false);
});

test("cancel clears both drawing and eraser selection", () => {
    const { drafter, state, settle } = createDrafter();
    drafter.beginDraw("polygon");
    drafter.toggleDelete();
    drafter.cancelDraw();
    settle();
    assert.equal(state.active, null);
    assert.equal(state.removal, false);
    assert.equal(drafter.drawing, false);
    assert.ok(Object.values(drafter.buttons_pressed).every((pressed) => pressed === false));
});

for (const tool of ["polygon", "circle", "rectangle"]) {
    test(`${tool} toolbar toggle stops vertices until explicitly selected again`, () => {
        const { drafter, state, complete, settle, click, action } = createDrafter();
        action(tool, true);
        assert.equal(drafter.buttons_pressed[tool], true);
        click();
        assert.equal(state.vertices, 1);

        action(tool, true);
        settle();
        click();
        assert.equal(state.active, null);
        assert.equal(state.vertices, 0, "Partial drawing must be discarded on deselection");
        assert.equal(drafter.drawing, false);
        assert.equal(drafter.buttons_pressed[tool], false);

        action(tool, true);
        complete();
        assert.equal(drafter.buttons_pressed[tool], true, "Completed shapes retain the selected tool");
        action(tool, true);
        settle();
        click();
        assert.equal(state.active, null);
        assert.equal(state.vertices, 0);
        assert.equal(drafter.layers.length, 1, "Deselection must preserve completed geometry");

        action(tool, true);
        complete();
        assert.equal(drafter.layers.length, 2);
    });
}

test("programmatic draw activation remains idempotent and tool switching is exclusive", () => {
    const { drafter, state, action } = createDrafter();
    action("polygon");
    action("polygon");
    assert.equal(state.active, "Polygon");
    action("circle", true);
    assert.equal(state.active, "Circle");
    assert.equal(drafter.buttons_pressed.polygon, false);
    assert.equal(drafter.buttons_pressed.circle, true);
});

test("deselecting a drawing tool restores popups disabled while drawing", () => {
    const popup = { content: "Existing feature" };
    let boundPopup = popup;
    const layer = {
        _leaflet_id: "feature",
        closePopup() {},
        getPopup: () => boundPopup,
        unbindPopup: () => { boundPopup = null; },
        bindPopup: (value) => { boundPopup = value; },
    };
    const { action } = createDrafter(layer);
    action("polygon", true);
    assert.equal(boundPopup, null);
    action("polygon", true);
    assert.equal(boundPopup, popup);
});

test("drawn areas are published without POLYGON columns and cleared on last removal or reset", () => {
    const { drafter, complete } = createDrafter();
    const emitted = [];
    drafter.$emit = (event, value) => { if (event === "areas-changed") emitted.push(value); };
    drafter.beginDraw("polygon");
    const layer = complete();
    assert.equal(emitted.at(-1)[0].type, "Polygon");
    const handlers = {};
    layer.on = (event, callback) => { handlers[event] = callback; };
    drafter.setupLayerEvents(layer);
    handlers["pm:remove"]({ layer });
    assert.deepEqual(emitted.at(-1), []);
    drafter.beginDraw("circle");
    complete();
    drafter.map.removeLayer = () => {};
    drafter.deleteAll();
    assert.deepEqual(emitted.at(-1), []);
});
