/** @jsxImportSource gnim */

import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import { isEqual } from "es-toolkit";
import { type Accessor, computed, type JSX, type MaybeAccessor } from "gnim";
import { type Properties, read } from "../lib/bind";
import { bindWidget, type ComponentProps } from "../lib/widget";

/** Inline markup or a path to an .svg file. */
export type SvgSource = { markup: string } | { file: string };

export interface SvgProperties {
  source: SvgSource | undefined;
  /** Index of a state defined by the SVG document; its meaning depends on the file. */
  state: number;
  /** Overrides the rendering weight. `-1` uses the default. */
  weight: number;
}

export type SvgProps = ComponentProps<
  Gtk.Image,
  SvgProperties,
  // Image sources are replaced by the SVG paintable; children and src are SVG input.
  "children" | "src" | "paintable" | "file" | "iconName" | "gicon" | "resource"
> & {
  /** Inline SVG markup. Takes precedence over `src` and `source`. */
  children?: MaybeAccessor<string> | MaybeAccessor<string>[];
  /** Path to an .svg file. Takes precedence over `source`. */
  src?: MaybeAccessor<string>;
};

const EMPTY_SVG = `<svg xmlns="http://www.w3.org/2000/svg"/>`;
const encoder = new TextEncoder();

const loadSource = (svg: Gtk.Svg, source: SvgSource) => {
  try {
    const bytes =
      "markup" in source
        ? GLib.Bytes.new(encoder.encode(source.markup))
        : Gio.File.new_for_path(source.file).load_bytes(null)[0];
    svg.load_from_bytes(bytes);
  } catch (error) {
    console.warn("Svg: failed to load source:", error);
  }
};

// Applied in this order, so `state` and `weight` act on the loaded document.
const properties: Properties<SvgProperties, Gtk.Svg> = {
  source: {
    // Gtk.Svg has no way to unload, so an empty document stands in for none.
    apply: (value, svg) => loadSource(svg, value ?? { markup: EMPTY_SVG }),
    equals: isEqual,
  },
  state: { apply: (value, svg) => svg.set_state(value) },
  weight: {
    apply: (value, svg) => {
      svg.weight = value;
    },
  },
} as const;

/**
 * Merges `children`, `src` and `source` into a single source, in that order
 * of precedence. Children are joined into one markup string.
 */
const resolveSource = ({
  children,
  src,
  source,
}: SvgProps): Accessor<SvgSource | undefined> => {
  const parts = children === undefined ? [] : [children].flat();

  return computed(() => {
    if (parts.length > 0) return { markup: parts.map(read).join("") };
    if (src !== undefined) return { file: read(src) };
    return read(source);
  });
};

/** Creates the `Gtk.Svg` paintable shown by the image; properties bind to it. */
const createPaintable = (image: Gtk.Image): Gtk.Svg => {
  const paintable = Gtk.Svg.new();
  paintable.connect("error", (_svg, error) => {
    console.warn(`Svg: ${error.message}`);
  });
  image.set_from_paintable(paintable);
  return paintable;
};

/** Renders an SVG through `Gtk.Svg`, displayed in a `Gtk.Image`. */
export const Svg = (props: SvgProps): JSX.Element => {
  const { ref, rest } = bindWidget(props, {
    properties,
    values: { ...props, source: resolveSource(props) },
    target: createPaintable,
    owned: ["children", "src"],
  });

  return <Gtk.Image {...rest} ref={ref} />;
};
