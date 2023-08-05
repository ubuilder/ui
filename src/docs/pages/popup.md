# Popup

## Default

This is default Popup

```js
Button(["click me", Popup("Hi, it is Popup")])

```

## arrow and click
arrow and click

```js
Button(["click me", Popup({trigger: 'click', arrow: true, placement: 'right'},"Hi, it is Popup")])

```

## target
you can set target for popup

```js
View([
  Button({id: 'popup-btn'},"click me"),
  Popup({target: '#popup-btn', arrow: true}, 'this is popup'),
])

```

## Trigger

default value is 'click', available options are 'click' and 'hover'

```js
[
  Button(["hover me", Popup({ trigger: "hover" }, "Hi, it is Popup")]),
  Button(["click me", Popup({ trigger: "click" }, "Hi, it is Popup")]),
];
```

## Persistant

(Not working?) Prevent closing the Popup when mouse is over it, default value is 'true'

```js
[
  Button([
    "hover, non-persistant",
    Popup({ trigger: "hover", persistant: false }, "Hi, it is Popup"),
  ]),
  Button([
    "hover, persistant",
    Popup({ trigger: "hover", persistant: true }, "Hi, it is Popup"),
  ]),
];
```

## Arrow
TODO: Add border for arrow

```js
[
  Button([
    "hover, non-persistant, arrow",
    Popup(
      { trigger: "hover", persistant: false, arrow: true },
      "Hi, it is Popup"
    ),
  ]),

  Button([
    "hover, non-persistant, no-arrow",
    Popup(
      { trigger: "hover", persistant: false, arrow: false },
      "Hi, it is Popup"
    ),
  ]),
];
```

## Placement

default is `bottom`, values can be any of `top`, `bottom`, ..., `top-start`, `top-end`,...

```js
[
  Button([
    "hover, persistant, arrow, top",
    Popup(
      { trigger: "hover", persistant: true, arrow: true, placement: "top" },
      "Hi, it is Popup"
    ),
  ]),
  Button([
    "hover, persistant, arrow, left",
    Popup(
      { trigger: "hover", persistant: true, arrow: true, placement: "left" },
      "Hi, it is Popup"
    ),
  ]),
  Button([
    "hover, persistant, arrow, bottom",
    Popup(
      { trigger: "hover", persistant: true, arrow: true, placement: "bottom" },
      "Hi, it is Popup"
    ),
  ]),
  Button([
    "hover, persistant, arrow, right",
    Popup(
      { trigger: "hover", persistant: true, arrow: true, placement: "right" },
      "Hi, it is Popup"
    ),
  ]),
];
```

## Component inside

components inside Popup

```js
[
  Button([
    "hover, persistant",
    Popup({ trigger: "hover", persistant: true }, [
      View([
        View("this is view1"),
        Popup({ trigger: "hover", persistant: true }, "Popup"),
      ]),
      View([
        View("this is view2"),
        Popup({ trigger: "hover", persistant: true }, "Popup"),
      ]),
    ]),
  ]),
];
```

## Focusable

TODO: Explain it's usage

```js
Button({$data: {test: 'test'}}, [
  "tooltip only",
  Popup(
    { trigger: "hover", focusAble: false, arrow: true },
    Input({ name: "test" })
  ),
]);
```

## With Form

Here is an example of form inside Popup

```js
[
  View({ border: "sm", style: "width: max-content" }, [
    "hover, persistant",
    Popup({ trigger: "hover", persistant: "true" }, [
      Container(
        { size: "xl", style: "max-width: 450px", mx: "auto", my: "sm" },
        [
          View({ tag: "h3", my: "sm" }, "Login form"),

          Form({$data: {username: '', password: ''}},[
            Input({ label: "Username", name: "username" }),
            Input({ label: "Password", name: "password" }),

            Col({ col: 12 }, [
              View({ border: true, p: "sm", mb: "sm" }, [
                View([
                  "Username: ",
                  View({ tag: "span", "u-text": "username" }),
                ]),
                View([
                  "password: ",
                  View({ tag: "span", "u-text": "password" }),
                ]),
              ]),
            ]),

            Button({ type: "submit", color: "primary" }, "Submit"),
          ]),
        ]
      ),
    ]),
  ]),
];
```
