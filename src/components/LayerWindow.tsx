import type Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import Gls from "gi://Gtk4LayerShell?version=1.0";
import {
  type CCProps,
  effect,
  isAccessor,
  type JSX,
  type MaybeAccessor,
  prop,
} from "gnim";
import {
  type ComponentLifecycleProps,
  createComponentLifecycle,
} from "../hooks/createComponentLifecycle";

export type Anchor = "top" | "bottom" | "left" | "right";

const edges: Record<Anchor, Gls.Edge> = {
  top: Gls.Edge.TOP,
  bottom: Gls.Edge.BOTTOM,
  left: Gls.Edge.LEFT,
  right: Gls.Edge.RIGHT,
};

const keyboardModes = {
  none: Gls.KeyboardMode.NONE,
  exclusive: Gls.KeyboardMode.EXCLUSIVE,
  "on-demand": Gls.KeyboardMode.ON_DEMAND,
};

const layers = {
  background: Gls.Layer.BACKGROUND,
  bottom: Gls.Layer.BOTTOM,
  top: Gls.Layer.TOP,
  overlay: Gls.Layer.OVERLAY,
};

type WindowProps = Omit<
  Extract<CCProps<Gtk.Window>, { construct?: never }>,
  "construct" | "visible"
> &
  JSX.IntrinsicClassAttributes<Gtk.Window>;

export type LayerWindowProps = WindowProps &
  ComponentLifecycleProps<Gtk.Window> & {
    anchor?: MaybeAccessor<readonly Anchor[]>;
    exclusivity?: MaybeAccessor<"normal" | "ignore" | "exclusive">;
    keyboardMode?: MaybeAccessor<keyof typeof keyboardModes>;
    layer?: MaybeAccessor<keyof typeof layers>;
    monitor?: MaybeAccessor<Gdk.Monitor | null>;
    namespace?: MaybeAccessor<string>;
    visible?: MaybeAccessor<boolean>;
  };

export const LayerWindow = (props: LayerWindowProps) => {
  const visible = prop(props.visible, false);
  const updates: Array<() => void> = [];
  let window: Gtk.Window;

  const bind = <T,>(
    input: MaybeAccessor<T> | undefined,
    apply: (value: T) => void,
  ) => {
    if (input === undefined) return;

    let initialized = false;
    let previous: T;

    const update = () => {
      const value = isAccessor(input) ? input() : input;
      if (initialized && Object.is(value, previous)) return;
      apply(value);
      previous = value;
      initialized = true;
    };

    updates.push(update);
    effect(update);
  };

  bind(props.namespace, (value) => Gls.set_namespace(window, value));
  bind(props.monitor, (value) => Gls.set_monitor(window, value));

  if (props.anchor !== undefined) {
    const names = Object.keys(edges) as Anchor[];

    bind(
      prop(props.anchor).as((value) =>
        names.filter((name) => value.includes(name)).join(","),
      ),
      (value) => {
        const selected = value.split(",");
        names.forEach((name) => {
          Gls.set_anchor(window, edges[name], selected.includes(name));
        });
      },
    );
  }

  bind(props.layer, (value) => Gls.set_layer(window, layers[value]));
  bind(props.keyboardMode, (value) =>
    Gls.set_keyboard_mode(window, keyboardModes[value]),
  );
  bind(props.exclusivity, (value) => {
    if (value === "exclusive") Gls.auto_exclusive_zone_enable(window);
    else Gls.set_exclusive_zone(window, value === "ignore" ? -1 : 0);
  });

  const init = createComponentLifecycle(props, (win) => {
    window = win;
    Gls.init_for_window(win);

    for (const update of updates) update();
  });

  const {
    anchor: _anchor,
    exclusivity: _exclusivity,
    keyboardMode: _keyboardMode,
    layer: _layer,
    monitor: _monitor,
    namespace: _namespace,
    onInit: _onInit,
    onMount: _onMount,
    onCleanup: _onCleanup,
    ref: _ref,
    visible: _visible,
    children,
    ...windowProps
  } = props;

  return (
    <Gtk.Window {...windowProps} ref={init} visible={visible}>
      {children}
    </Gtk.Window>
  );
};

export default LayerWindow;
