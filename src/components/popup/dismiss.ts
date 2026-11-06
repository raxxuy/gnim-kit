import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";

export const isEscape = (keyval: number) => keyval === Gdk.KEY_Escape;

/**
 * True when a click landed on the gesture's own widget (the backdrop), and
 * not on one of its descendants (the popup content).
 */
export const isBackdropClick = (
  gesture: Gtk.GestureClick,
  x: number,
  y: number,
) => {
  const widget = gesture.get_widget();
  return widget?.pick(x, y, Gtk.PickFlags.DEFAULT) === widget;
};
