import Gtk from "gi://Gtk?version=4.0";
import type { Position } from "./types";

type Placement = { halign: Gtk.Align; valign: Gtk.Align };

const { START, CENTER, END } = Gtk.Align;

export const PLACEMENTS: Record<Position, Placement> = {
  "top-left": { halign: START, valign: START },
  top: { halign: CENTER, valign: START },
  "top-right": { halign: END, valign: START },
  left: { halign: START, valign: CENTER },
  center: { halign: CENTER, valign: CENTER },
  right: { halign: END, valign: CENTER },
  "bottom-left": { halign: START, valign: END },
  bottom: { halign: CENTER, valign: END },
  "bottom-right": { halign: END, valign: END },
};
