/** Returns a shallow copy of `source` without the given keys. */
export const omit = <T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Omit<T, K> => {
  const copy = { ...source };
  for (const key of keys) delete copy[key];
  return copy;
};

/** Normalises `T | T[] | undefined` into an array. */
export const toArray = <T>(value: T | readonly T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? [...value] : [value as T];
