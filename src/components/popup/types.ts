import type Gtk from "gi://Gtk?version=4.0";
import type { MaybeAccessor, Portal } from "gnim";
import type { LayerWindowProps, Margin } from "../layer-window";

export type Position =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

export type Backdrop = "transparent" | "dim";

/** Whatever `<Portal mount={...}>` accepts, normally your Gtk.Application. */
export type PortalMount = Parameters<typeof Portal>[0]["mount"];

/** Layer-shell props the popup controls itself. */
type OwnedByPopup = "anchor" | "exclusivity" | "margin" | "visible";

export type PopupProps = Omit<LayerWindowProps, OwnedByPopup> & {
  /**
   * Where the popup window is mounted. The popup can be declared anywhere in
   * a component tree (e.g. inside a bar button) and still ends up here.
   */
  mount: PortalMount;

  /** Controlled: the popup is shown while this is true. */
  open: MaybeAccessor<boolean>;
  /** Called when the user asks to dismiss (Escape or click outside). */
  onClose?: () => void;

  /** Where the content sits on the monitor. Default: "top-right". */
  position?: MaybeAccessor<Position>;
  /** Gap between the content and the screen edges (e.g. bar height + gap). */
  offset?: MaybeAccessor<Margin>;

  /** "dim" adds a `dim` class next to `popup-backdrop`. Default: "transparent". */
  backdrop?: Backdrop;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;

  transition?: Gtk.RevealerTransitionType;
  /** In ms. Use 0 to disable the animation. */
  transitionDuration?: number;
};
