# Tooltip

## Default

simple Tooltip

```js
Button(["Login", Tooltip("Hi, Welcome!")]);
```

## Arrow

by default it has arrow

```js
[
  Button(["with arrow", Tooltip("Hi, Welcome!")]),
  Button(["without arrow", Tooltip({ arrow: false }, "Hi, Welcome!")]),
];
```

## Placement

The default value is bottom, this also support rest of mixed placemnts like: top-start and so

```js
[
  Button([
    "bottom",
    Tooltip({ placement: "bottom" }, "Hi, Welcome!"), //default is bottom
  ]),
  Button(["top", Tooltip({ placement: "top" }, "Hi, Welcome!")]),
  Button(["left", Tooltip({ placement: "left" }, "Hi, Welcome!")]),
  Button(["right", Tooltip({ placement: "right" }, "Hi, Welcome!")]),
];
```

## Trigger

by default the trigger is hover

```js
[
  Button(["hover", Tooltip({}, "Hi, Welcome!")]),
  Button(["click", Tooltip({ trigger: "click" }, "Hi, Welcome!")]),
];
```

## Compunent inside

it also can take components

```js
View({ style: "width: max-content;border: 2px solid gray" }, [
  "action",
  Tooltip({}, [
    View([
      Button({ color: "error" }, "cancel"),
      Button({ color: "primary" }, "ok"),
    ]),
  ]),
]);
```

## Different Target componen

You can change target element by changing 'target' property, supports css like selector

```js
[
  Button({ id: "my-button" }, "action"),
  Tooltip({ target: "#my-button" }, "This tooltip is not child of the button"),
];
```
