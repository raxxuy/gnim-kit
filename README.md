# gnim-kit

Reusable Gnim components for GTK4 applications.

## Installation

```sh
pnpm add github:raxxuy/gnim-kit
```

Pin a tag or commit with `github:raxxuy/gnim-kit#<revision>` for reproducible installs.

The package ships TypeScript/TSX source for bundling with Gnim. It requires compatible `gnim` and `@gnim-js/gtk4` peer dependencies, GTK4, and gtk4-layer-shell with its introspection typelib. The application is responsible for preloading gtk4-layer-shell and generating GI types (`gnim types`).

## Components

Every component forwards the props of the widget it wraps and accepts the lifecycle props:

- `onInit(widget)`: runs once the widget is constructed, before its children and reactive props are applied
- `onMount(widget)`: runs after mounting
- `onCleanup(widget)`: runs on scope disposal
- `ref`: a function or an array of functions, called right after `onInit`

### LayerWindow

A GTK4 layer-shell window wrapping `Gtk.Window`. `visible` defaults to `false`.

```tsx
import Gtk from "gi://Gtk?version=4.0";
import { LayerWindow } from "gnim-kit";

<LayerWindow anchor={["top", "left", "right"]} exclusivity="exclusive" visible>
  <Gtk.Box />
</LayerWindow>;
```

| Prop           | Values                                                                      |
| -------------- | --------------------------------------------------------------------------- |
| `anchor`       | Array of `top`, `bottom`, `left`, `right`                                   |
| `exclusivity`  | `normal` (zone 0), `ignore` (zone -1), `exclusive` (automatic), or a number |
| `keyboardMode` | `none`, `exclusive`, `on-demand`                                            |
| `layer`        | `background`, `bottom`, `top`, `overlay`                                    |
| `margin`       | A number for every edge, or `{ top?, bottom?, left?, right? }`              |
| `monitor`      | `Gdk.Monitor` or `null`                                                     |
| `namespace`    | String                                                                      |

All of them accept static values or accessors.

### Svg

Renders an SVG through `Gtk.Svg`, wrapping `Gtk.Image`. The SVG comes from one of three props, each a static value or an accessor:

```tsx
// Inline markup as children. Several children are joined into one document.
<Svg>{`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>`}</Svg>

// A file path
<Svg src="/path/to/icon.svg" />

// An object; `undefined` shows an empty image
<Svg source={{ markup: "<svg>...</svg>" }} />
<Svg source={{ file: "/path/to/icon.svg" }} />
```

Children take precedence over `src`, and `src` over `source`. Children are used whenever they are present, even when an accessor returns `""`. For an image that can be empty, use `source` with `undefined` instead. A path or markup that fails to load logs a warning.

| Prop     | Values                                               |
| -------- | ---------------------------------------------------- |
| `state`  | Number of a state defined by the SVG document        |
| `weight` | Rendering weight override; `-1` restores the default |

`Gtk.Image` props are forwarded, except `paintable`, `file`, `iconName`, `gicon` and `resource`, because the SVG supplies the image.

## Writing a component

Each component is a single file in `src/components/`. It declares the properties it binds and lets `bindWidget` handle the rest. The building blocks are exported too, so applications can write their own:

For example, `Gtk.Calendar` can only mark days through methods (`mark_day`, `clear_marks`), so a `marked` prop needs a bound property:

```tsx
import Gtk from "gi://Gtk?version=4.0";
import { isEqual } from "es-toolkit";
import { bindWidget, type ComponentProps, type Properties } from "gnim-kit";

interface CalendarProperties {
  marked: readonly number[];
}

const properties: Properties<CalendarProperties, Gtk.Calendar> = {
  marked: {
    apply: (days, calendar) => {
      calendar.clear_marks();
      for (const day of days) calendar.mark_day(day);
    },
    equals: isEqual,
  },
};

export type CalendarProps = ComponentProps<Gtk.Calendar, CalendarProperties>;

export const Calendar = (props: CalendarProps) => {
  const { ref, rest } = bindWidget(props, { properties });
  return <Gtk.Calendar {...rest} ref={ref} />;
};

// <Calendar marked={[1, 15]} showWeekNumbers />
```

- `ComponentProps<W, P, Owned>`: the widget's props (minus `P` and `Owned`), lifecycle props, and every key of `P` as a static value or accessor.
- `Properties<P, Target>`: one `apply` per key, plus an optional `equals` (defaults to `Object.is`). They are applied in declaration order.
- `bindWidget(props, options)`: binds `properties`, wires up the lifecycle, and returns the `ref` and the `rest` props to forward. Its options:
  - `values`: derived values to bind instead of `props`, such as a normalised source.
  - `target(widget)`: the object to bind to. It defaults to the widget. Return `undefined` to skip binding.
  - `owned`: extra props the component consumes that must not reach the widget.

Use bound properties for anything Gnim can't bind as a plain GObject property, such as imperative setters, values that need conversion, or a second object like `Gtk.Svg`'s paintable. Plain properties go straight through to the widget.

The lower-level `bindProperties`, `createLifecycle`, `lifecycleKeys` and `WidgetProps` are exported for components that don't wrap a single widget, along with the helpers `read` (reads a static value or an accessor) and `keysOf` (typed `Object.keys`).

## Development

```sh
nix develop   # optional
pnpm install
pnpm types    # generate GI types
pnpm check    # typecheck and lint
```

## License

MIT
