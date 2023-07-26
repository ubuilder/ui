# Popover

## Default

This is default Popover

```js
Button(["click me", Popover("Hi, it is popover")])

```

## Trigger

default value is 'click', available options are 'click' and 'hover'

```js
[
  Button(["hover me", Popover({ trigger: "hover" }, "Hi, it is popover")]),
  Button(["click me", Popover({ trigger: "click" }, "Hi, it is popover")]),
];
```

## Persistant

(Not working?) Prevent closing the popover when mouse is over it, default value is 'true'

```js
[
  Button([
    "hover, non-persistant",
    Popover({ trigger: "hover", persistant: false }, "Hi, it is popover"),
  ]),
  Button([
    "hover, persistant",
    Popover({ trigger: "hover", persistant: true }, "Hi, it is popover"),
  ]),
];
```

## Arrow
TODO: Add border for arrow

```js
[
  Button([
    "hover, non-persistant, arrow",
    Popover(
      { trigger: "hover", persistant: false, arrow: true },
      "Hi, it is popover"
    ),
  ]),

  Button([
    "hover, non-persistant, no-arrow",
    Popover(
      { trigger: "hover", persistant: false, arrow: false },
      "Hi, it is popover"
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
    Popover(
      { trigger: "hover", persistant: true, arrow: true, placement: "top" },
      "Hi, it is popover"
    ),
  ]),
  Button([
    "hover, persistant, arrow, left",
    Popover(
      { trigger: "hover", persistant: true, arrow: true, placement: "left" },
      "Hi, it is popover"
    ),
  ]),
  Button([
    "hover, persistant, arrow, bottom",
    Popover(
      { trigger: "hover", persistant: true, arrow: true, placement: "bottom" },
      "Hi, it is popover"
    ),
  ]),
  Button([
    "hover, persistant, arrow, right",
    Popover(
      { trigger: "hover", persistant: true, arrow: true, placement: "right" },
      "Hi, it is popover"
    ),
  ]),
];
```

## Component inside

components inside popover

```js
[
  Button([
    "hover, persistant",
    Popover({ trigger: "hover", persistant: true }, [
      View([
        View("this is view1"),
        Popover({ trigger: "hover", persistant: true }, "popover"),
      ]),
      View([
        View("this is view2"),
        Popover({ trigger: "hover", persistant: true }, "popover"),
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
  Popover(
    { trigger: "hover", focusAble: false, arrow: true },
    Input({ name: "test" })
  ),
]);
```

## With Form

Here is an example of form inside popover

```js
[
  View({ border: "sm", style: "width: max-content" }, [
    "hover, persistant",
    Popover({ trigger: "hover", persistant: "true" }, [
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
