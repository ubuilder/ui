# Icon

## Default

Default usage

```js
Icon({ name: "plus" });
```

## Size

```js
[
  Icon({ color: "primary", name: "info-circle", size: "xs" }),
  Icon({ color: "primary", name: "info-circle", size: "sm" }),
  Icon({ color: "primary", name: "info-circle", size: "md" }),
  Icon({ color: "primary", name: "info-circle", size: "lg" }),
  Icon({ color: "primary", name: "info-circle", size: "xl" }),
];
```

## Colors

```js
[
  Icon({ name: "user", color: "primary" }),
  Icon({ name: "user", color: "secondary" }),
  Icon({ name: "user", color: "success" }),
  Icon({ name: "user", color: "info" }),
  Icon({ name: "user", color: "warning" }),
  Icon({ name: "user", color: "error" }),
  Icon({ name: "user", color: "light" }),
  Icon({ name: "user", color: "dark" }),
];
```

## Dynamic

```js
[
  View({ $data: { icon: "", color: "primary", size: "md" } }, [
    Row([
      Input({ col: 12, colSm: 4, label: "Enter icon name...", name: "icon" }),
      Select({ col: 12, colSm: 4, 
        items: ["xs", "sm", "md", "lg", "xl", '2xl', '3xl', '4xl', '5xl', '6xl'],
        label: "Choose size...",
        name: "size",
      }),
      Select({ col: 12, colSm: 4, 
        items: [
          "primary",
          "secondary",
          "success",
          "info",
          "error",
          "warning",
          "dark",
          "light",
        ],
        label: "Choose color...",
        name: "color",
      }),
    ]),
    Icon({
      m: "xl",
      size: "xl",
      $name: "icon",
      $color: "color",
      $size: "size",
    }),
  ]),
];
```
