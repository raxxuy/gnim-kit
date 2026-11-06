import type Gtk from "gi://Gtk?version=4.0";
import Gls from "gi://Gtk4LayerShell?version=1.0";
import { createBinder } from "../../hooks/createBinder";
import { layerProperties, layerPropertyKeys } from "./properties";
import type { LayerPropertyKey, LayerShellProps } from "./types";

/**
 * Binds layer-shell props to a window. Call it inside a component, then pass
 * the returned function the window once it exists.
 *
 * Falls back to a regular window when layer-shell is unavailable.
 */
export const createLayerShell = (props: LayerShellProps) => {
  // Only set once layer-shell is initialised, which is what gates the binder.
  let layerWindow: Gtk.Window | undefined;
  const { bind, flush } = createBinder(() => layerWindow);

  const bindProperty = <K extends LayerPropertyKey>(key: K) => {
    const { apply, equals } = layerProperties[key]!;
    bind(props[key], apply, equals);
  };

  for (const key of layerPropertyKeys) bindProperty(key);

  return (window: Gtk.Window) => {
    if (!Gls.is_supported()) {
      console.warn(
        "LayerWindow: layer-shell is not supported here, falling back to a regular window.",
      );
      return;
    }

    if (!Gls.is_layer_window(window)) Gls.init_for_window(window);

    layerWindow = window;
    flush();
  };
};
