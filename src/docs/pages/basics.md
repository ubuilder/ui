# Basic Features

In this page you can see how it is possible to use Alpine features using our components. 


## Data
Before using these components, it is remcommended to learn basics of <a href="https://alpinejs.dev">Alpine.js</a>, Here you can see how [x-data](https://alpinejs.dev/directives/data) works in Alpine

```js
[
  View({ $data: { name: "Name", username: "Username" } }, [
    View([
      "data: ",
      View({ $text: "JSON.stringify({name, username})" }),
    ]),
  ]),
];
```

## Text

[x-text](https://alpinejs.dev/directives/text)

```js
[
  View({ $data: { name: "Name", username: "Username" } }, [
    View(["name: ", View({ $text: "name" })]),
    View(["username: ", View({ $text: "username" })]),
  ]),
];
```


## If statements

[x-if](https://alpinejs.dev/directives/if)

```js
View(
  {
    $data: { show: true },
  },
  [
    View({ $text: "show" }), View({ $if: "show" }, "Show is true"),
    View({ $text: "show" }), View({ $if: "!show" }, "Show is false")
  ]
);
```

## For loops

[x-for](https://alpinejs.dev/directives/for)

```js
View(
  {
    $data: { len: 8 },
  },
  [
    View(["Length: ", View({ $text: "len" })]),
    View({ border: true, d: "flex", gap: "xs" }, [
      View({ $for: "item in len", $text: "item", p: "xs" }),
    ]),
  ]
);
```

## Events

[x-on](https://alpinejs.dev/directives/on)

```js
[
  View({ $data: { count: 0 } }, [
    Button({ onClick: "count++" }, [
      "Count:",
      View({ $text: "count" }),
    ]),
  ]),
];
```

## Bind Attributes

[x-bind](https://alpinejs.dev/directives/bind)

```js
[
  View({ $data: { disabled: false } }, [
    Button({
      onClick: "disabled = !disabled",
      $text: "disabled ? 'Enable' : 'Disable'",
    }),
    Button(
      { $color: "disabled ? 'secondary' : 'primary'" },
      "Color of this button is dynamic"
    ),
  ]),
];
```

```js
[
  View({ $data: { size: "sm" } }, [
    Select({ items: ["sm", "md", "lg", "xl"], label: "Size", name: "size" }),
    View({ $p: "size", border: true }, [
      "padding: ",
      View({ $text: "size" }),
    ]),
  ]),
];
```
