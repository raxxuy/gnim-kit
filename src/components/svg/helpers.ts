import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import type Gtk from "gi://Gtk?version=4.0";
import { computed, isAccessor, type MaybeAccessor } from "gnim";
import { toArray } from "../../utils/object";
import type { SvgInputProps, SvgSource } from "./types";

const encoder = new TextEncoder();

const read = <T>(value: MaybeAccessor<T>) =>
  isAccessor(value) ? value() : value;

export const sameSource = (
  a: SvgSource | undefined,
  b: SvgSource | undefined,
) => {
  if (a === undefined || b === undefined) return a === b;
  return "markup" in a
    ? "markup" in b && a.markup === b.markup
    : "file" in b && a.file === b.file;
};

export const loadSource = (svg: Gtk.Svg, source: SvgSource) => {
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

const EMPTY_SVG = `<svg xmlns="http://www.w3.org/2000/svg"/>`;

/** Gtk.Svg has no documented "unload", so load an empty document instead. */
export const clearSource = (svg: Gtk.Svg) =>
  loadSource(svg, { markup: EMPTY_SVG });

/**
 * Collapses `children`, `src` and `source` into one `source` value.
 * Precedence: children (inline markup), then src (file), then source.
 * Stays static unless one of the inputs is an accessor.
 */
export const resolveSource = ({
  children,
  src,
  source,
}: SvgInputProps): MaybeAccessor<SvgSource | undefined> => {
  const parts = children === undefined ? [] : toArray(children);

  const resolve = (): SvgSource | undefined => {
    if (parts.length > 0) {
      return { markup: parts.map((part) => read(part)).join("") };
    }
    if (src !== undefined) return { file: read(src) };
    return read(source);
  };

  const reactive = [...parts, src, source].some((value) => isAccessor(value));
  return reactive ? computed(resolve) : resolve();
};
