# Badge

## Default

this is defualt badge component

```js
Badge("Default");
```

## Colors

```js
[
  Badge({ color: "primary" }, "primary"),
  Badge({ color: "secondary" }, "secondary"),
  Badge({ color: "success" }, "success"),
  Badge({ color: "warning" }, "warning"),
  Badge({ color: "info" }, "info"),
  Badge({ color: "error" }, "error"),
  Badge({ color: "light" }, "light"),
  Badge({ color: "dark" }, "dark"),
];
```

## Sizes

```js
View({d: 'flex', align: 'end', wrap: true, gap: 'xs'}, [
  Badge({ color: 'primary', size: 'xs' }, "Extra Small"),
  Badge({ color: 'primary', size: 'sm' }, "Small"),
  Badge({ color: 'primary', size: 'md' }, "Medium"),
  Badge({ color: 'primary', size: 'lg' }, "Large"),
  Badge({ color: 'primary', size: 'xl' }, "Extra Large"),
]);
```
