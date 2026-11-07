import type Gtk from "gi://Gtk?version=4.0";
import Gls from "gi://Gtk4LayerShell?version=1.0";
import { createBinder } from "../../hooks/createBinder";
import { layerProperties, layerPropertyKeys } from "./properties";
import type { LayerPropertyKey, LayerShellProps } from "./types";

let warnedUnsupported = false;

const warnUnsupported = () => {
  if (warnedUnsupported) return;
  warnedUnsupported = true;
  console.warn(
    "LayerWindow: layer-shell is not supported here, falling back to regular windows.",
  );
};

/**
 * Binds layer-shell props to a window. Call it inside a component, then pass
 * the returned function the window once it exists.
 *
 * Falls back to a regular window when layer-shell is unavailable, in which
 * case no bindings are created at all.
 */
export const createLayerShell = (props: LayerShellProps) => {
  if (!Gls.is_supported()) {
    warnUnsupported();
    return (_window: Gtk.Window) => {};
  }

  // Only set once layer-shell is initialised, which is what gates the binder.
  let layerWindow: Gtk.Window | undefined;
  const { bind, flush } = createBinder(() => layerWindow);

  const bindProperty = <K extends LayerPropertyKey>(key: K) => {
    const { apply, equals } = layerProperties[key];
    bind(props[key], apply, equals);
  };

  for (const key of layerPropertyKeys) bindProperty(key);

  return (window: Gtk.Window) => {
    if (!Gls.is_layer_window(window)) Gls.init_for_window(window);

    layerWindow = window;
    flush();
  };
};
