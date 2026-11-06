/** @jsxImportSource gnim */

import Gtk from "gi://Gtk?version=4.0";
import { Portal, prop } from "gnim";
import { omit, toArray } from "../../utils/object";
import { type Anchor, LayerWindow, resolveMargin } from "../layer-window";
import { createPopupReveal } from "./createPopupReveal";
import { isBackdropClick, isEscape } from "./dismiss";
import { PLACEMENTS } from "./placement";
import type { PopupProps } from "./types";

/** The window covers the whole monitor so the backdrop can catch clicks. */
const FULLSCREEN: readonly Anchor[] = ["top", "bottom", "left", "right"];

/** Props consumed here that must not be forwarded to LayerWindow. */
const ownKeys = [
  "mount",
  "open",
  "onClose",
  "position",
  "offset",
  "backdrop",
  "closeOnEscape",
  "closeOnClickOutside",
  "transition",
  "transitionDuration",
  "ref",
  "children",
] as const satisfies readonly (keyof PopupProps)[];

export const Popup = (props: PopupProps) => {
  const {
    backdrop = "transparent",
    closeOnEscape = true,
    closeOnClickOutside = true,
    transition = Gtk.RevealerTransitionType.CROSSFADE,
    transitionDuration = 150,
  } = props;

  const close = () => props.onClose?.();
  const reveal = createPopupReveal(props.open);

  const placement = prop(props.position, "top-right").as(
    (position) => PLACEMENTS[position],
  );
  const margin = prop(props.offset, 0).as(resolveMargin);

  return (
    <Portal mount={props.mount}>
      <LayerWindow
        {...omit(props, ownKeys)}
        anchor={FULLSCREEN}
        exclusivity="ignore"
        keyboardMode={props.keyboardMode ?? "exclusive"}
        layer={props.layer ?? "overlay"}
        ref={[reveal.attachWindow, ...toArray(props.ref)]}
      >
        {closeOnEscape && (
          <Gtk.EventControllerKey
            onKeyPressed={(_self, keyval) => {
              if (!isEscape(keyval)) return false;
              close();
              return true;
            }}
          />
        )}

        <Gtk.Box
          cssClasses={
            backdrop === "dim" ? ["popup-backdrop", "dim"] : ["popup-backdrop"]
          }
          hexpand
          vexpand
        >
          {closeOnClickOutside && (
            <Gtk.GestureClick
              onPressed={(self, _presses, x, y) => {
                if (isBackdropClick(self, x, y)) close();
              }}
            />
          )}

          <Gtk.Revealer
            halign={placement.as((value) => value.halign)}
            hexpand
            marginBottom={margin.as((value) => value.bottom)}
            marginEnd={margin.as((value) => value.right)}
            marginStart={margin.as((value) => value.left)}
            marginTop={margin.as((value) => value.top)}
            onNotifyChildRevealed={reveal.onChildRevealed}
            ref={reveal.attachRevealer}
            transitionDuration={transitionDuration}
            transitionType={transition}
            valign={placement.as((value) => value.valign)}
            vexpand
          >
            {props.children}
          </Gtk.Revealer>
        </Gtk.Box>
      </LayerWindow>
    </Portal>
  );
};

export default Popup;
