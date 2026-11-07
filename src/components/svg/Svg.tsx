/** @jsxImportSource gnim */

import Gtk from "gi://Gtk?version=4.0";
import type { CCProps, JSX } from "gnim";
import {
  type ComponentLifecycleProps,
  createComponentLifecycle,
} from "../../hooks/createComponentLifecycle";
import { omit } from "../../utils/object";
import { createSvg } from "./createSvg";
import { svgPropertyKeys } from "./properties";
import type { SvgShellProps, SvgSourceProps } from "./types";

type ImageProps = Omit<
  Extract<CCProps<Gtk.Image>, { construct?: never }>,
  | "construct"
  | "children"
  // Owned by the component: the paintable comes from the SVG source.
  | "paintable"
  | "file"
  | "iconName"
  | "gicon"
  | "resource"
> &
  JSX.IntrinsicClassAttributes<Gtk.Image>;

export type SvgProps = ImageProps &
  ComponentLifecycleProps<Gtk.Image> &
  SvgShellProps &
  SvgSourceProps;

/** Props consumed here that must not reach the underlying Gtk.Image. */
const ownKeys = [
  ...svgPropertyKeys,
  "onInit",
  "onMount",
  "onCleanup",
  "ref",
  "children",
  "src",
] as const satisfies readonly (keyof SvgProps)[];

export const Svg = (props: SvgProps) => {
  const attachSvg = createSvg(props);
  const ref = createComponentLifecycle(props, attachSvg);

  return <Gtk.Image {...omit(props, ownKeys)} ref={ref} />;
};

export default Svg;
