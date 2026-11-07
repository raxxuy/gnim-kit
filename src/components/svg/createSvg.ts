import Gtk from "gi://Gtk?version=4.0";
import { createBinder } from "../../hooks/createBinder";
import { resolveSource } from "./helpers";
import { svgProperties, svgPropertyKeys } from "./properties";
import type { SvgInputProps, SvgPropertyKey, SvgShellProps } from "./types";

/**
 * Binds Gtk.Svg props to a paintable. Call it inside a component, then pass
 * the returned function the image once it exists.
 */
export const createSvg = (input: SvgInputProps) => {
  const props: SvgShellProps = { ...input, source: resolveSource(input) };
  const paintable = Gtk.Svg.new();

  paintable.connect("error", (_svg, error) => {
    console.warn(`Svg: ${error.message}`);
  });

  // Only set once the image exists, which is what gates the binder.
  let target: Gtk.Svg | undefined;
  const { bind, flush } = createBinder(() => target);

  const bindProperty = <K extends SvgPropertyKey>(key: K) => {
    const { apply, equals } = svgProperties[key];
    bind(props[key], apply, equals);
  };

  for (const key of svgPropertyKeys) bindProperty(key);

  return (image: Gtk.Image) => {
    image.set_from_paintable(paintable);
    target = paintable;
    flush();
  };
};
