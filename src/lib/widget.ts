import { omit } from "es-toolkit";
import type { CCProps, JSX } from "gnim";
import { bindProperties, keysOf, type Properties, type Reactive } from "./bind";
import {
  createLifecycle,
  type LifecycleProps,
  lifecycleKeys,
} from "./lifecycle";

/** Props of the widget class `W`, without `construct` and `Omitted`. */
export type WidgetProps<W, Omitted extends PropertyKey = never> = Omit<
  Extract<CCProps<W>, { construct?: never }>,
  "construct" | Omitted
> &
  JSX.IntrinsicClassAttributes<W>;

/**
 * Props of a component wrapping widget `W` that binds properties `P`:
 * the widget's own props (minus `P` and `Owned`), lifecycle props, and `P`
 * as static values or accessors.
 */
export type ComponentProps<
  W,
  P,
  Owned extends PropertyKey = never,
> = WidgetProps<W, keyof P | Owned> & LifecycleProps<W> & Reactive<P>;

export type BindWidgetOptions<W, P, Target, Props> = {
  properties: Properties<P, Target>;
  /** Values to bind, when they differ from `props` (e.g. normalised). Defaults to `props`. */
  values?: Reactive<P>;
  /**
   * Maps the widget to the object the properties are bound to, once per
   * instance. Defaults to the widget itself; `undefined` skips binding.
   */
  target?: (widget: W) => Target | undefined;
  /** Additional props handled by the component and not forwarded to the widget. */
  owned?: readonly (keyof Props)[];
};

/**
 * Sets up a component that wraps a single widget: binds `properties` and
 * the lifecycle props. Returns the widget's `ref` and the `rest` of the
 * props, which are forwarded to the widget.
 */
export const bindWidget = <
  W,
  P,
  Props extends Reactive<P>,
  Target = W,
  Owned extends keyof Props = never,
>(
  props: Props & LifecycleProps<W>,
  options: BindWidgetOptions<W, P, Target, Props> & {
    owned?: readonly Owned[];
  },
) => {
  const { properties, values = props, target, owned = [] } = options;
  const attach = bindProperties(values, properties);

  const ref = createLifecycle<W>(props, (widget) => {
    const resolved = target ? target(widget) : (widget as unknown as Target);
    if (resolved !== undefined) attach(resolved);
  });

  // All of these are keys of Props, which TS cannot infer for a generic P.
  const consumed = [
    ...keysOf(properties),
    ...lifecycleKeys,
    ...owned,
  ] as (keyof Props)[];

  type Rest = Omit<Props, keyof P | (typeof lifecycleKeys)[number] | Owned>;
  return { ref, rest: omit(props, consumed) as Rest };
};
