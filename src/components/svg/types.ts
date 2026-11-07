import type { MaybeAccessor } from "gnim";

/** Inline markup or a path to an .svg file. */
export type SvgSource = { markup: string } | { file: string };

/** Plain value type of every Gtk.Svg property we bind. Single source of truth. */
export interface SvgProperties {
  source: SvgSource | undefined;
  /** Named state defined by the SVG itself. Meaning is per-file. */
  state: number;
  /** Overrides the rendering weight. `-1` uses the default. */
  weight: number;
}

export type SvgPropertyKey = keyof SvgProperties;

/** Every Gtk.Svg property as an optional static value or accessor. */
export type SvgShellProps = {
  [K in SvgPropertyKey]?: MaybeAccessor<SvgProperties[K]>;
};

/** Ways to pass the source besides the `source` prop itself. */
export type SvgSourceProps = {
  /** Inline SVG markup. Wins over `src`. */
  children?: MaybeAccessor<string> | MaybeAccessor<string>[];
  /** Path to an .svg file. Wins over `source`. */
  src?: MaybeAccessor<string>;
};

/** Everything `createSvg` consumes. */
export type SvgInputProps = SvgShellProps & SvgSourceProps;
