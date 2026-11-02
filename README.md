# gnim-kit

Reusable Gnim components and hooks for GTK4 applications.

## Installation

Install from GitHub:

```sh
npm install github:raxxuy/gnim-kit
pnpm add github:raxxuy/gnim-kit
yarn add github:raxxuy/gnim-kit
bun add github:raxxuy/gnim-kit
```

Pin a tag or commit with `github:raxxuy/gnim-kit#<revision>` for reproducible installs.

The package exports TypeScript/TSX source for bundling with Gnim. It requires compatible `gnim` and `@gnim-js/gtk4` peer dependencies, GTK4, and gtk4-layer-shell with its introspection typelib. The application is responsible for preloading gtk4-layer-shell and generating GI types (`gnim types`).

## LayerWindow

A GTK4 layer-shell window. Standard `Gtk.Window` props are forwarded; `visible` defaults to `false`.

```tsx
import Gtk from "gi://Gtk?version=4.0";
import { LayerWindow } from "gnim-kit";

<LayerWindow anchor={["top", "left", "right"]} exclusivity="exclusive" visible>
  <Gtk.Box />
</LayerWindow>;
```

Layer-shell props accept static values or Gnim accessors:

| Prop           | Values                                                              |
| -------------- | ------------------------------------------------------------------- |
| `anchor`       | Array of `top`, `bottom`, `left`, `right`                           |
| `exclusivity`  | `normal` (zone 0), `ignore` (zone -1), `exclusive` (automatic zone) |
| `keyboardMode` | `none`, `exclusive`, `on-demand`                                    |
| `layer`        | `background`, `bottom`, `top`, `overlay`                            |
| `monitor`      | `Gdk.Monitor` or `null`                                             |
| `namespace`    | String                                                              |

`onInit` runs after layer-shell setup, before children and reactive properties are applied. `onMount` runs after mounting, and `onCleanup` runs on scope disposal. For example, focus the window's child after it has been attached:

```tsx
<LayerWindow onMount={(window) => window.get_child()?.grab_focus()}>
  <Gtk.Entry />
</LayerWindow>
```

Use `onCleanup` to release resources associated with the window. Async errors from callbacks are the caller's responsibility.

## Component lifecycle

`ComponentLifecycleProps<T>` and `createComponentLifecycle` provide the same lifecycle and ref handling to other components. Call the hook in a Gnim component scope and use its return value as the widget's ref:

```tsx
import Gtk from "gi://Gtk?version=4.0";
import {
  createComponentLifecycle,
  type ComponentLifecycleProps,
} from "gnim-kit";

function MyButton(props: ComponentLifecycleProps<Gtk.Button>) {
  const init = createComponentLifecycle(props, (button) => {
    button.set_label("Hello");
  });
  return <Gtk.Button ref={init} />;
}
```

The optional setup runs first, followed by `onInit` and `ref`. Strip lifecycle props before forwarding other props to the widget.

## License

MIT
