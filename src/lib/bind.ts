import {
  computed,
  effect,
  isAccessor,
  type MaybeAccessor,
  untrack,
} from "gnim";

/** Reads a static value or an accessor. Accessor reads are tracked. */
export const read = <T>(value: MaybeAccessor<T>): T =>
  isAccessor(value) ? value() : value;

export type Equals<T> = (a: T, b: T) => boolean;

/** Every key of `T` as an optional static value or accessor. */
export type Reactive<T> = { [K in keyof T]?: MaybeAccessor<T[K]> };

/** How one property is pushed onto a target object. */
export type Property<T, Target> = {
  apply: (value: T, target: Target) => void;
  /** Whether two values are equal; equal values are not re-applied. Defaults to `Object.is`. */
  equals?: Equals<T>;
};

/** One {@link Property} per key of `T`. Applied in declaration order. */
export type Properties<T, Target> = {
  [K in keyof T]-?: Property<T[K], Target>;
};

/** `Object.keys` typed as the keys of `object`. */
export const keysOf = <T extends object>(object: T) =>
  Object.keys(object) as (keyof T)[];

/**
 * Keeps imperative setters in sync with props that may be static or reactive.
 * Returns an `attach(target)` function, typically called from a widget `ref`.
 *
 * Attaching applies every property right away, in declaration order, the same
 * way Gnim applies accessor props to widgets: through an immediate effect that
 * re-applies only when `equals` reports a change.
 */
export const bindProperties =
  <T, Target>(props: Reactive<T>, properties: Properties<T, Target>) =>
  (target: Target): void => {
    const bind = <K extends keyof T>(key: K) => {
      const source: MaybeAccessor<T[K]> | undefined = props[key];
      if (source === undefined) return;

      // A static value has no dependencies, so the effect runs exactly once.
      const { apply, equals } = properties[key];
      const value = computed(() => read(source), { equals });
      effect(
        () => {
          const next = value();
          untrack(() => apply(next, target));
        },
        { immediate: true },
      );
    };

    for (const key of keysOf(properties)) bind(key);
  };
