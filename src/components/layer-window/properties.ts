import type Gtk from "gi://Gtk?version=4.0";
import Gls from "gi://Gtk4LayerShell?version=1.0";
import type { Equals } from "../../hooks/createBinder";
import { ANCHORS, EDGES, KEYBOARD_MODES, LAYERS } from "./constants";
import { resolveMargin, sameAnchors, sameMargins } from "./helpers";
import type { Exclusivity, LayerProperties, LayerPropertyKey } from "./types";

type PropertyDefinition<T> = {
  apply: (value: T, window: Gtk.Window) => void;
  /** Defaults to `Object.is`. Needed for arrays and objects. */
  equals?: Equals<T>;
};

type PropertyDefinitions = {
  [K in LayerPropertyKey]: PropertyDefinition<LayerProperties[K]>;
};

const applyExclusivity = (value: Exclusivity, window: Gtk.Window) => {
  if (value === "exclusive") Gls.auto_exclusive_zone_enable(window);
  else if (value === "ignore") Gls.set_exclusive_zone(window, -1);
  else if (value === "normal") Gls.set_exclusive_zone(window, 0);
  else Gls.set_exclusive_zone(window, value);
};

export const layerProperties: PropertyDefinitions = {
  anchor: {
    apply: (value, window) => {
      for (const name of ANCHORS) {
        Gls.set_anchor(window, EDGES[name], value.includes(name));
      }
    },
    equals: sameAnchors,
  },

  exclusivity: { apply: applyExclusivity },

  keyboardMode: {
    apply: (value, window) =>
      Gls.set_keyboard_mode(window, KEYBOARD_MODES[value]),
  },

  layer: { apply: (value, window) => Gls.set_layer(window, LAYERS[value]) },

  margin: {
    apply: (value, window) => {
      const margins = resolveMargin(value);
      for (const name of ANCHORS) {
        Gls.set_margin(window, EDGES[name], margins[name]);
      }
    },
    equals: sameMargins,
  },

  monitor: { apply: (value, window) => Gls.set_monitor(window, value) },

  namespace: { apply: (value, window) => Gls.set_namespace(window, value) },
};

export const layerPropertyKeys = Object.keys(
  layerProperties,
) as LayerPropertyKey[];
