import { effect, isAccessor, type MaybeAccessor } from "gnim";

export type Equals<T> = (a: T, b: T) => boolean;

/**
 * Creates a binder that keeps imperative setters in sync with values that may
 * be static or reactive (accessors).
 *
 * Nothing is applied until `getContext` returns something. That makes it safe
 * to declare every binding up front and flush them all once the target
 * (a window, a widget, ...) is actually ready.
 *
 * - Values are always read first, so effects subscribe to their accessors
 *   even when they first run before the context exists.
 * - Unchanged values are skipped, so a flush followed by the first effect
 *   run never applies the same value twice.
 */
export const createBinder = <C>(getContext: () => C | undefined) => {
  const syncs: Array<() => void> = [];

  const bind = <T>(
    source: MaybeAccessor<T> | undefined,
    apply: (value: T, context: C) => void,
    equals: Equals<T> = Object.is,
  ) => {
    if (source === undefined) return;

    let last: { value: T } | undefined;

    const sync = () => {
      const value = isAccessor(source) ? source() : source;

      const context = getContext();
      if (context === undefined) return;
      if (last && equals(last.value, value)) return;

      last = { value };
      apply(value, context);
    };

    syncs.push(sync);
    effect(sync);
  };

  /** Applies every binding once. Call when the context becomes available. */
  const flush = () => {
    for (const sync of syncs) sync();
  };

  return { bind, flush };
};
