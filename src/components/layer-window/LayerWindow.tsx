/** @jsxImportSource gnim */

import Gtk from "gi://Gtk?version=4.0";
import { type CCProps, type JSX, type MaybeAccessor, prop } from "gnim";
import {
  type ComponentLifecycleProps,
  createComponentLifecycle,
} from "../../hooks/createComponentLifecycle";
import { omit } from "../../utils/object";
import { createLayerShell } from "./createLayerShell";
import { layerPropertyKeys } from "./properties";
import type { LayerShellProps } from "./types";

type WindowProps = Omit<
  Extract<CCProps<Gtk.Window>, { construct?: never }>,
  "construct" | "visible"
> &
  JSX.IntrinsicClassAttributes<Gtk.Window>;

export type LayerWindowProps = WindowProps &
  ComponentLifecycleProps<Gtk.Window> &
  LayerShellProps & {
    visible?: MaybeAccessor<boolean>;
  };

/** Props consumed here that must not reach the underlying Gtk.Window. */
const ownKeys = [
  ...layerPropertyKeys,
  "onInit",
  "onMount",
  "onCleanup",
  "ref",
  "visible",
  "children",
] as const satisfies readonly (keyof LayerWindowProps)[];

export const LayerWindow = (props: LayerWindowProps) => {
  const visible = prop(props.visible, false);
  const attachLayerShell = createLayerShell(props);
  const ref = createComponentLifecycle(props, attachLayerShell);

  return (
    <Gtk.Window {...omit(props, ownKeys)} ref={ref} visible={visible}>
      {props.children}
    </Gtk.Window>
  );
};

export default LayerWindow;
