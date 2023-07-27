# Alert

## Default

```js
Alert({ title: "This is Alert", icon: "check" });
```

## Content

```js
Alert({ title: "This is Alert", icon: "check" }, "Description of alert");
```

## Colors

```js
View([
  Alert(
    { color: "primary", title: "Primary Alert", icon: "check" },
    "This is Primary Alert"
  ),
  Alert(
    { color: "secondary", title: "Secondary Alert", icon: "check" },
    "This is Secondary Alert"
  ),
  Alert(
    { color: "success", title: "Success Alert", icon: "check" },
    "This is Success Alert"
  ),
  Alert(
    { color: "error", title: "Error Alert", icon: "check" },
    "This is Error Alert"
  ),
  Alert(
    { color: "warning", title: "Warning Alert", icon: "check" },
    "This is Warning Alert"
  ),
  Alert(
    { color: "info", title: "Info Alert", icon: "check" },
    "This is Info Alert"
  ),
]);
```

## Dismissible

```js
Alert(
  { dismissible: true, title: "You can close this alert", icon: "check" },
  "Description of alert"
);
```

## AutoClose

```js
[
  "Reload page if there is no alert here<br/>",
  Alert(
  { id: 'auto-close-alert', autoClose: true, title: "this will close in 5 seconds", icon: "check" },
  "Description of alert"
)
]
```

## Alert Container (static)

supported values are top-start, top-end, bottom-start and bottom-end

```js
AlertContainer({ name: "my-alert-container" }, [
  Alert({ title: "First", icon: "check" }, "First Alert"),
  Alert({ title: "Second", color: "error" }, "Second Alert"),
]);
```

## Container placement

```js
[
  View("Alert container is open in top-right side of page"),
  Button(
    {
      onClick:
        "$alert('my-alert-container-2', {title: 'Title',content: 'This is alert', color: 'primary'})",
    },
    "Add Alert in this container"
  ),
  AlertContainer({ name: "my-alert-container-2", placement: "top-end" }, [
    Alert(
      { title: "Container Placement", icon: "check" },
      "This is AlertContainer with top-end placement"
    ),
  ]),
];
```

## Container Add new Alerts

You can use `$alert` magic to add new alerts

```js
[
  View([
    Button(
      {
        onClick:
          "$alert('my-alert-container-3', {content: 'Hello', color: 'info', dismissible: true})",
      },
      "Bottom right"
    ),
    Button(
      {
        onClick:
          "$alert('my-alert-container-2', {content: 'Hello', color: 'warning', dismissible: true})",
      },
      "top right"
    ),
  ]),
  AlertContainer({
    name: "my-alert-container-3",
    placement: "bottom-end",
  }),
];
```
