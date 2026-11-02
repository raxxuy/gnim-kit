import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import vm from "node:vm";

function render(props) {
  let source = readFileSync(
    new URL("./LayerWindow.tsx", import.meta.url),
    "utf8",
  );
  for (const [pattern, replacement] of [
    [/^import[\s\S]*?;\n/gm, ""],
    ["export const LayerWindow =", "globalThis.LayerWindow ="],
    [
      / {2}return \(\n {4}<Gtk\.Window[\s\S]*?\n {2}\);/,
      "  return { init, windowProps };",
    ],
    ["export default LayerWindow;", ""],
  ]) {
    const updated = source.replace(pattern, replacement);
    assert.notEqual(updated, source);
    source = updated;
  }
  const calls = [];
  const effects = [];
  const mounts = [];
  const cleanups = [];
  const Gls = {
    Edge: { TOP: 0, BOTTOM: 1, LEFT: 2, RIGHT: 3 },
    Layer: { BACKGROUND: 10, BOTTOM: 11, TOP: 12, OVERLAY: 13 },
    KeyboardMode: { NONE: 20, EXCLUSIVE: 21, ON_DEMAND: 22 },
  };
  for (const name of [
    "init_for_window",
    "set_namespace",
    "set_monitor",
    "set_anchor",
    "set_layer",
    "set_keyboard_mode",
    "auto_exclusive_zone_enable",
    "set_exclusive_zone",
  ]) {
    Gls[name] = (...args) => calls.push([name, ...args]);
  }
  const context = vm.createContext({
    Gls,
    isAccessor: (value) => typeof value === "function",
    prop: (value, fallback) => {
      const accessor =
        typeof value === "function" ? value : () => value ?? fallback;
      accessor.as = (map) => () => map(accessor());
      return accessor;
    },
    effect: (fn) => effects.push(fn),
    onMount: (fn) => mounts.push(fn),
    onCleanup: (fn) => cleanups.push(fn),
  });
  const lifecycleSource = readFileSync(
    new URL("../hooks/createComponentLifecycle.ts", import.meta.url),
    "utf8",
  )
    .replace(/^import .*;\n/gm, "")
    .replace(
      "export const createComponentLifecycle",
      "const createComponentLifecycle",
    );
  vm.runInContext(stripTypeScriptTypes(lifecycleSource), context);
  vm.runInContext(stripTypeScriptTypes(source), context);
  const component = context.LayerWindow(props);
  const window = {};
  component.init(window);
  return {
    calls,
    effects,
    mounts,
    cleanups,
    window,
    windowProps: component.windowProps,
  };
}

test("initializes layer-shell options and updates reactive values", () => {
  let anchors = ["top", "right"];
  let exclusivity = "normal";
  const result = render({
    anchor: () => anchors,
    exclusivity: () => exclusivity,
    layer: "top",
    keyboardMode: "on-demand",
  });
  const { calls, window } = result;
  assert.deepEqual(calls.splice(0), [
    ["init_for_window", window],
    ["set_anchor", window, 0, true],
    ["set_anchor", window, 1, false],
    ["set_anchor", window, 2, false],
    ["set_anchor", window, 3, true],
    ["set_layer", window, 12],
    ["set_keyboard_mode", window, 22],
    ["set_exclusive_zone", window, 0],
  ]);
  anchors = ["right", "top"];
  result.effects.forEach((fn) => {
    fn();
  });
  assert.deepEqual(calls, []);
  anchors = [];
  exclusivity = "exclusive";
  result.effects.forEach((fn) => {
    fn();
  });
  assert.deepEqual(calls, [
    ["set_anchor", window, 0, false],
    ["set_anchor", window, 1, false],
    ["set_anchor", window, 2, false],
    ["set_anchor", window, 3, false],
    ["auto_exclusive_zone_enable", window],
  ]);
});

test("monitor changes include null and skip unchanged values", () => {
  let monitor = null;
  const { calls, effects, window } = render({ monitor: () => monitor });
  assert.deepEqual(calls.splice(0), [
    ["init_for_window", window],
    ["set_monitor", window, null],
  ]);
  const display = {};
  monitor = display;
  effects.forEach((fn) => {
    fn();
  });
  effects.forEach((fn) => {
    fn();
  });
  monitor = null;
  effects.forEach((fn) => {
    fn();
  });
  effects.forEach((fn) => {
    fn();
  });
  assert.deepEqual(calls, [
    ["set_monitor", window, display],
    ["set_monitor", window, null],
  ]);
});

test("reactive keyboard modes and layers map to GTK values", () => {
  let mode = "none";
  let layer = "background";
  const { calls, effects, window } = render({
    keyboardMode: () => mode,
    layer: () => layer,
  });
  assert.deepEqual(calls.splice(0), [
    ["init_for_window", window],
    ["set_layer", window, 10],
    ["set_keyboard_mode", window, 20],
  ]);
  for (const [nextMode, nextLayer] of [
    ["exclusive", "bottom"],
    ["on-demand", "top"],
    ["none", "overlay"],
  ]) {
    mode = nextMode;
    layer = nextLayer;
    effects.forEach((fn) => {
      fn();
    });
  }
  effects.forEach((fn) => {
    fn();
  });
  assert.deepEqual(calls, [
    ["set_layer", window, 11],
    ["set_keyboard_mode", window, 21],
    ["set_layer", window, 12],
    ["set_keyboard_mode", window, 22],
    ["set_layer", window, 13],
    ["set_keyboard_mode", window, 20],
  ]);
});

test("exclusivity maps ignore and static exclusive modes", () => {
  let mode = "normal";
  const { calls, effects, window } = render({ exclusivity: () => mode });
  assert.deepEqual(calls.splice(0), [
    ["init_for_window", window],
    ["set_exclusive_zone", window, 0],
  ]);
  mode = "ignore";
  effects.forEach((fn) => {
    fn();
  });
  mode = "exclusive";
  effects.forEach((fn) => {
    fn();
  });
  effects.forEach((fn) => {
    fn();
  });
  assert.deepEqual(calls, [
    ["set_exclusive_zone", window, -1],
    ["auto_exclusive_zone_enable", window],
  ]);
  const fixed = render({ exclusivity: "exclusive" });
  assert.deepEqual(fixed.calls, [
    ["init_for_window", fixed.window],
    ["auto_exclusive_zone_enable", fixed.window],
  ]);
});

test("mount and cleanup callbacks run separately from initialization", () => {
  const events = [];
  const result = render({
    onInit: (window) => events.push(["init", window]),
    ref: [
      (window) => events.push(["ref1", window]),
      (window) => events.push(["ref2", window]),
    ],
    onMount: (window) => events.push(["mount", window]),
    onCleanup: (window) => events.push(["cleanup", window]),
    title: "test",
  });
  assert.deepEqual(events, [
    ["init", result.window],
    ["ref1", result.window],
    ["ref2", result.window],
  ]);
  assert.equal(result.windowProps.title, "test");
  assert.equal("onMount" in result.windowProps, false);
  assert.equal("onCleanup" in result.windowProps, false);
  result.mounts.forEach((fn) => {
    fn();
  });
  result.cleanups.forEach((fn) => {
    fn();
  });
  assert.deepEqual(events, [
    ["init", result.window],
    ["ref1", result.window],
    ["ref2", result.window],
    ["mount", result.window],
    ["cleanup", result.window],
  ]);
});
