import GLib from "gi://GLib?version=2.0";
import type Gtk from "gi://Gtk?version=4.0";
import { type MaybeAccessor, onMount } from "gnim";
import { createBinder } from "../../hooks/createBinder";

type Context = { window: Gtk.Window; revealer: Gtk.Revealer };

/**
 * Drives the open/close lifecycle of a popup:
 *
 * - open:  show the window, then reveal the content on the next idle so the
 *          revealer is already mapped and can animate.
 * - close: un-reveal the content, then hide the window once the animation
 *          has finished (`onChildRevealed`), so the exit is not cut off.
 *
 * Nothing runs before the whole tree is mounted. `ref` fires before children
 * are appended, so showing the window from a ref would map it half-built.
 */
export const createPopupReveal = (open: MaybeAccessor<boolean>) => {
  let window: Gtk.Window | undefined;
  let revealer: Gtk.Revealer | undefined;
  let mounted = false;
  let wanted = false;

  const { bind, flush } = createBinder<Context>(() =>
    mounted && window && revealer ? { window, revealer } : undefined,
  );

  bind(open, (isOpen, ctx) => {
    wanted = isOpen;

    if (!isOpen) {
      ctx.revealer.set_reveal_child(false);
      return;
    }

    ctx.window.set_visible(true);
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      if (wanted) ctx.revealer.set_reveal_child(true);
      return GLib.SOURCE_REMOVE;
    });
  });

  // `flush` is idempotent, so calling it from every trigger is safe.
  onMount(() => {
    mounted = true;
    flush();
  });

  return {
    attachWindow: (value: Gtk.Window) => {
      window = value;
      if (mounted) flush();
    },
    attachRevealer: (value: Gtk.Revealer) => {
      revealer = value;
      if (mounted) flush();
    },
    /** Hides the window after the exit animation has finished. */
    onChildRevealed: (self: Gtk.Revealer) => {
      if (!self.get_reveal_child() && !self.get_child_revealed()) {
        window?.set_visible(false);
      }
    },
  };
};
