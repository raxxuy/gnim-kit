import { onCleanup, onMount } from "gnim";
import { toArray } from "../utils/object";

export type ComponentLifecycleProps<T> = {
  /** Runs after component setup, before children and reactive properties. */
  onInit?: (instance: T) => void;
  /** Runs after the component is mounted. */
  onMount?: (instance: T) => void;
  /** Runs when the component's scope is disposed. */
  onCleanup?: (instance: T) => void;
  ref?: ((instance: T) => void) | Array<(instance: T) => void>;
};

/** Call inside a component and use the returned function as its instance ref. */
export const createComponentLifecycle = <T>(
  props: ComponentLifecycleProps<T>,
  setup?: (instance: T) => void,
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
    setup?.(value);
    props.onInit?.(value);

    for (const ref of toArray(props.ref)) ref(value);
  };
};
