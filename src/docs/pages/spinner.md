# Spinner

## Default

this is default spinner component

```js
Spinner();
```

## Colors

```js
View({ d: "flex", align: "end", wrap: true, gap: "xs" }, [
  Spinner({ color: "primary" }),
  Spinner({ color: "secondary" }),
  Spinner({ color: "success" }),
  Spinner({ color: "warning" }),
  Spinner({ color: "info" }),
  Spinner({ color: "error" }),
  Spinner({ color: "light" }),
  Spinner({ color: "dark" }),
]);
```

## Sizes

```js
View({ d: "flex", align: "end", wrap: true, gap: "xs" }, [
  Spinner({ color: "primary", size: "xs" }),
  Spinner({ color: "primary", size: "sm" }),
  Spinner({ color: "primary", size: "md" }),
  Spinner({ color: "primary", size: "lg" }),
  Spinner({ color: "primary", size: "xl" }),
]);
```
