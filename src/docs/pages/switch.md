# Switch

## Default

Default switch button

```js
Switch();
```

## Label

With Label

```js
Switch({ label: "Switch Button" });
```

## Initial Value

```js
Switch({ label: "Active by default", checked: true });
```

## Bind Value

```js
View({ $data: { visible: true } }, [
  Switch({ label: "Visible", name: "visible" }),
  View({ $show: "visible", pt: 'xl' }, "Content"),
]);
```

## With Form

```js
Form(
  {
    style: 'max-width: 400px',
    method: "GET",
    action: "/ui/switch",
    $data: { username: "", password: "", remember: false },
  },
  [
    Input({ name: "username", label: "Username" }),
    Input({ name: "password", label: "Password", type: "password" }),
    Switch({ name: "remember", label: "Remember Me" }),
    Button({ color: "primary" }, "Login"),
  ]
);
```
