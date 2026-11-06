import { ANCHORS } from "./constants";
import type { Anchor, Margin } from "./types";

export const resolveMargin = (margin: Margin): Record<Anchor, number> =>
  typeof margin === "number"
    ? { top: margin, bottom: margin, left: margin, right: margin }
    : {
        top: margin.top ?? 0,
        bottom: margin.bottom ?? 0,
        left: margin.left ?? 0,
        right: margin.right ?? 0,
      };

export const sameAnchors = (a: readonly Anchor[], b: readonly Anchor[]) =>
  ANCHORS.every((name) => a.includes(name) === b.includes(name));

export const sameMargins = (a: Margin, b: Margin) => {
  const x = resolveMargin(a);
  const y = resolveMargin(b);
  return ANCHORS.every((name) => x[name] === y[name]);
};
