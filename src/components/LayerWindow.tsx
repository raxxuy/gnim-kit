/** @jsxImportSource gnim */

import type Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import Gls from "gi://Gtk4LayerShell?version=1.0";
import { isEqual } from "es-toolkit";
import type { JSX, MaybeAccessor } from "gnim";
import { keysOf, type Properties } from "../lib/bind";
import { bindWidget, type ComponentProps } from "../lib/widget";

export type Anchor = "top" | "bottom" | "left" | "right";
export type Layer = "background" | "bottom" | "top" | "overlay";
export type KeyboardMode = "none" | "exclusive" | "on-demand";

/**
 * - "normal":    no exclusive zone, other surfaces may overlap this one
 * - "ignore":    ignore other surfaces' exclusive zones (e.g. wallpapers)
 * - "exclusive": reserve space equal to the window size (bars, docks)
 * - number:      reserve exactly this many px
 */
export type Exclusivity = "normal" | "ignore" | "exclusive" | number;

/** A single number applies to every edge. */
export type Margin = number | Partial<Record<Anchor, number>>;

export interface LayerProperties {
  anchor: readonly Anchor[];
  exclusivity: Exclusivity;
  keyboardMode: KeyboardMode;
  layer: Layer;
  margin: Margin;
  /**
   * Output to show the window on; `null` lets the compositor choose.
   * Only applies reliably before the window is first mapped.
   */
  monitor: Gdk.Monitor | null;
  /**
   * Name compositors match layer rules against, e.g. Hyprland's
   * `layerrule` with `match:namespace`. Only applies reliably before the
   * window is first mapped.
   */
  namespace: string;
}

export type LayerWindowProps = ComponentProps<
  Gtk.Window,
  LayerProperties,
  "visible"
> & {
  /** Defaults to `false`. */
  visible?: MaybeAccessor<boolean>;
};

const EDGES: Record<Anchor, Gls.Edge> = {
  top: Gls.Edge.TOP,
  bottom: Gls.Edge.BOTTOM,
  left: Gls.Edge.LEFT,
  right: Gls.Edge.RIGHT,
} as const;

const ANCHORS = keysOf(EDGES);

const KEYBOARD_MODES: Record<KeyboardMode, Gls.KeyboardMode> = {
  none: Gls.KeyboardMode.NONE,
  exclusive: Gls.KeyboardMode.EXCLUSIVE,
  "on-demand": Gls.KeyboardMode.ON_DEMAND,
} as const;

const LAYERS: Record<Layer, Gls.Layer> = {
  background: Gls.Layer.BACKGROUND,
  bottom: Gls.Layer.BOTTOM,
  top: Gls.Layer.TOP,
  overlay: Gls.Layer.OVERLAY,
} as const;

const resolveMargin = (margin: Margin): Record<Anchor, number> =>
  typeof margin === "number"
    ? { top: margin, bottom: margin, left: margin, right: margin }
    : { top: 0, bottom: 0, left: 0, right: 0, ...margin };

const properties: Properties<LayerProperties, Gtk.Window> = {
  anchor: {
    apply: (value, window) => {
      for (const edge of ANCHORS) {
        Gls.set_anchor(window, EDGES[edge], value.includes(edge));
      }
    },
    equals: (a, b) => isEqual(new Set(a), new Set(b)),
  },
  exclusivity: {
    apply: (value, window) => {
      if (value === "exclusive") Gls.auto_exclusive_zone_enable(window);
      else if (value === "ignore") Gls.set_exclusive_zone(window, -1);
      else if (value === "normal") Gls.set_exclusive_zone(window, 0);
      else Gls.set_exclusive_zone(window, value);
    },
  },
  keyboardMode: {
    apply: (value, window) =>
      Gls.set_keyboard_mode(window, KEYBOARD_MODES[value]),
  },
  layer: {
    apply: (value, window) => Gls.set_layer(window, LAYERS[value]),
  },
  margin: {
    apply: (value, window) => {
      const margins = resolveMargin(value);
      for (const edge of ANCHORS) {
        Gls.set_margin(window, EDGES[edge], margins[edge]);
      }
    },
    equals: (a, b) => isEqual(resolveMargin(a), resolveMargin(b)),
  },
  monitor: { apply: (value, window) => Gls.set_monitor(window, value) },
  namespace: { apply: (value, window) => Gls.set_namespace(window, value) },
} as const;

let warnedUnsupported = false;

/** Turns the window into a layer surface, or skips binding if unsupported. */
const initLayerShell = (window: Gtk.Window): Gtk.Window | undefined => {
  if (!Gls.is_supported()) {
    if (!warnedUnsupported) {
      warnedUnsupported = true;
      console.warn(
        "LayerWindow: layer-shell is not supported here, falling back to regular windows.",
      );
    }
    return undefined;
  }

  if (!Gls.is_layer_window(window)) Gls.init_for_window(window);
  return window;
};

/** A GTK4 layer-shell window. Plain `Gtk.Window` props are forwarded. */
export const LayerWindow = (props: LayerWindowProps): JSX.Element => {
  const { ref, rest } = bindWidget(props, {
    properties,
    target: initLayerShell,
    owned: ["visible"],
  });

  return <Gtk.Window {...rest} ref={ref} visible={props.visible ?? false} />;
};
