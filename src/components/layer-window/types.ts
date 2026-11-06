import type Gdk from "gi://Gdk?version=4.0";
import type { MaybeAccessor } from "gnim";

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

/** Plain value type of every layer-shell property. Single source of truth. */
export interface LayerProperties {
  anchor: readonly Anchor[];
  exclusivity: Exclusivity;
  keyboardMode: KeyboardMode;
  layer: Layer;
  margin: Margin;
  /** `null` lets the compositor choose the output. */
  monitor: Gdk.Monitor | null;
  /** Shows up in compositor rules, e.g. Hyprland `layerrule` match:namespace. */
  namespace: string;
}

export type LayerPropertyKey = keyof LayerProperties;

/** Every layer-shell property as an optional static value or accessor. */
export type LayerShellProps = {
  [K in LayerPropertyKey]?: MaybeAccessor<LayerProperties[K]>;
};
