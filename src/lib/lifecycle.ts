import { onCleanup, onMount } from "gnim";

export type LifecycleProps<T> = {
  /** Runs once the widget is constructed, before its children and reactive props are applied. */
  onInit?: (instance: T) => void;
  /** Runs after the component is mounted. */
  onMount?: (instance: T) => void;
  /** Runs when the component's scope is disposed. */
  onCleanup?: (instance: T) => void;
  /** Receives the widget right after `onInit`. */
  ref?: ((instance: T) => void) | Array<(instance: T) => void>;
};

/** Keys of {@link LifecycleProps}, which are not forwarded to the widget. */
export const lifecycleKeys = [
  "onInit",
  "onMount",
  "onCleanup",
  "ref",
] as const satisfies readonly (keyof LifecycleProps<unknown>)[];

/**
 * Creates the `ref` for a component's widget from its lifecycle props.
 * The ref runs each `setup` in order, then `onInit`, then every `ref`.
 * `onMount` and `onCleanup` are registered on the current scope.
 */
export const createLifecycle = <T>(
  props: LifecycleProps<T>,
  ...setup: Array<(instance: T) => void>
): ((instance: T) => void) => {
  let instance: T | undefined;

  onMount(() => {
    if (instance !== undefined) props.onMount?.(instance);
  });

  onCleanup(() => {
    if (instance !== undefined) props.onCleanup?.(instance);
  });

  return (value) => {
    instance = value;
    for (const fn of setup) fn(value);
    props.onInit?.(value);

    for (const fn of [props.ref ?? []].flat()) fn(value);
  };
};
