import type Gtk from "gi://Gtk?version=4.0";
import type { Equals } from "../../hooks/createBinder";
import { clearSource, loadSource, sameSource } from "./helpers";
import type { SvgProperties, SvgPropertyKey } from "./types";

type PropertyDefinition<T> = {
  apply: (value: T, svg: Gtk.Svg) => void;
  /** Defaults to `Object.is`. Needed for objects. */
  equals?: Equals<T>;
};

type PropertyDefinitions = {
  [K in SvgPropertyKey]: PropertyDefinition<SvgProperties[K]>;
};

// Order matters: `source` must load before `state` and `weight` are applied.
export const svgProperties: PropertyDefinitions = {
  source: {
    apply: (value, svg) =>
      value === undefined ? clearSource(svg) : loadSource(svg, value),
    equals: sameSource,
  },

  state: { apply: (value, svg) => svg.set_state(value) },

  weight: {
    apply: (value, svg) => {
      svg.weight = value;
    },
  },
};

export const svgPropertyKeys = Object.keys(svgProperties) as SvgPropertyKey[];
