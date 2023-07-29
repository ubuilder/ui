# Tabs

## Default

First tab is open by default

```js
Tabs([
  TabsList([TabsItem("Home"), TabsItem("Profile"), TabsItem("Settings")]),
  TabsContent([
    TabsPanel(["Content of Home tab"]),
    TabsPanel(["Content of Profile tab"]),
    TabsPanel(["Content of Settings tab"]),
  ]),
]);
```

## Active
You can change active tab by adding `active: true` prop for tab item.

```js
[
// Tabs([
//   TabsList([
//     TabsItem("Home"),
//     TabsItem({ active: true }, "Profile"),
//     TabsItem("Settings"),
//   ]),
//   TabsContent([
//     TabsPanel(["Content of Home tab"]),
//     TabsPanel(["Content of Profile tab (Active by default)"]),
//     TabsPanel(["Content of Settings tab"]),
//   ]),
// ]);
]
```

## Disabled

You can make a tab disabled by adding `disabled: true` prop

```js
Tabs([
  TabsList([
    TabsItem("Home"),
    TabsItem("Profile"),
    TabsItem({ disabled: true }, "Settings"),
  ]),
  TabsContent([
    TabsPanel(["Content of Home tab"]),
    TabsPanel(["Content of Profile tab"]),
    TabsPanel(["Content of Settings tab (disabled)"]),
  ]),
]);
```

## Tabs With Icon

```js
Tabs([
  TabsList([
    TabsItem([Icon({ name: "home" }), "Home"]),
    TabsItem([Icon({ name: "user" }), "Profile"]),
    TabsItem({ ms: "auto" }, [Icon({ name: "settings" })]),
  ]),
  TabsContent([
    TabsPanel(["Content of Home tab"]),
    TabsPanel(["Content of Profile tab"]),
    TabsPanel(["Content of Settings tab"]),
  ]),
]);
```

## Tabs With Form

```js
Form(
  {
    $data: {
      name: "",
      username: "",
      email: "",
      password: "",
      password2: "",
      dob: "",
    },
  },
  [
    Tabs([
      TabsList([
        TabsItem([Icon({ name: "user" }), "Personal Details"]),
        TabsItem([Icon({ name: "key" }), "Account Details"]),
        TabsItem({ $disabled: "!name && !username && !email" }, [
          Icon({ name: "article" }),
          "Summary",
        ]),
      ]),
      Card([
        TabsContent([
          TabsPanel([
            Row([
              Input({ name: "name", label: "Name" }),
              Input({ name: "email", label: "Email" }),
              Input({ name: "dob", label: "Birth Date", type: "date" }),
            ]),
          ]),
          TabsPanel([
            Row([
              Input({ name: "username", label: "Username" }),
              Input({ name: "password", label: "Password", type: "password" }),
              Input({
                name: "password2",
                label: "Repeat Password",
                type: "password",
              }),
            ]),
          ]),
          TabsPanel([
            Row([
              Col({ col: 12, colSm: 6 }, [
                View({ p: "xs" }, [
                  View({ tag: "strong" }, "Name: "),
                  View({ $text: "name" }),
                ]),
              ]),
              Col({ col: 12, colSm: 6 }, [
                View({ p: "xs" }, [
                  View({ tag: "strong" }, "Email: "),
                  View({ $text: "email" }),
                ]),
              ]),
              Col({ col: 12, colSm: 6 }, [
                View({ p: "xs" }, [
                  View({ tag: "strong" }, "Birth Date: "),
                  View({ $text: "dob" }),
                ]),
              ]),
              Col({ col: 12, colSm: 6 }, [
                View({ p: "xs" }, [
                  View({ tag: "strong" }, "Username: "),
                  View({ $text: "username" }),
                ]),
              ]),
              Col({ col: 12, colSm: 6 }, [
                View({ p: "xs" }, [
                  View({ tag: "strong" }, "Password: "),
                  View({ $text: "password" }),
                ]),
              ]),
              Col({ col: 12, colSm: 6 }, [
                View({ p: "xs" }, [
                  View({ tag: "strong" }, "Repeat Password: "),
                  View({ $text: "password2" }),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]
);
```