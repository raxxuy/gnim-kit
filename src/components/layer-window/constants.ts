import Gls from "gi://Gtk4LayerShell?version=1.0";
import type { Anchor, KeyboardMode, Layer } from "./types";

export const EDGES: Record<Anchor, Gls.Edge> = {
  top: Gls.Edge.TOP,
  bottom: Gls.Edge.BOTTOM,
  left: Gls.Edge.LEFT,
  right: Gls.Edge.RIGHT,
};

export const ANCHORS = Object.keys(EDGES) as Anchor[];

export const KEYBOARD_MODES: Record<KeyboardMode, Gls.KeyboardMode> = {
  none: Gls.KeyboardMode.NONE,
  exclusive: Gls.KeyboardMode.EXCLUSIVE,
  "on-demand": Gls.KeyboardMode.ON_DEMAND,
};

export const LAYERS: Record<Layer, Gls.Layer> = {
  background: Gls.Layer.BACKGROUND,
  bottom: Gls.Layer.BOTTOM,
  top: Gls.Layer.TOP,
  overlay: Gls.Layer.OVERLAY,
};
