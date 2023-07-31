# TextEditor

## Default

this simple text editor with default values

```js
TextEditor();
```

## Texteditor type

type determine the number of options in toolbar.

available options are: `basic`, `simple`, `standard` and `advanced`

## type basic

```js
TextEditor({ type: "basic", h: "6xl", me: "lg", mb: "lg" });
```

## type simple

```js
TextEditor({ type: "simple", h: "6xl", me: "lg", mb: "lg" });
```

## type standard

```js
TextEditor({type: 'standard', h: '6xl', me: 'lg', mb: 'lg'}),
```

## type advanced

```js
TextEditor({ type: "advanced", h: "6xl", me: "lg", mb: "lg" });
```

## initial Value

```js
TextEditor({ value: "write your comment", h: "6xl", me: "lg", mb: "lg" });
```

## Label & Placehoder

```js
TextEditor({
  placeholder: "write your comment",
  label: "comment",
  h: "6xl",
  me: "lg",
  mb: "lg",
});
```

## Value binding

with name prop you can bind the value of editor with some variable

```js
View({ $data: { comment: "" } }, [
  View({ $text: "comment" }),
  TextEditor({ name: "comment", h: "6xl", me: "lg", mb: "lg" }),
]);
```

```js
View({$data: {comment: ''}},[
    Button({onClick: "comment= ''" }, 'Reset comment'),
    View({$text: 'comment'}),
    TextEditor({name: 'comment', h: '6xl', me: 'lg', mb: 'lg'}),
]),
```

## Inside Form

just like other form element it can send the form data, under the hood it acts as textarea tag.

```js
Form({ p: "sm" }, [
  View({ tag: "fieldset" }, [
    View({ tag: "legend" }, "Send your comment"),
    Input({ col: 12, label: "User Name" }),
    Input({ col: 12, label: "email" }),
    TextEditor({ col: 12, label: "comment" }),

    Button({ type: "submit" }, "Submit"),
  ]),
]);
```

## Example With Form

```js
Form(
  {
    $data: {
      username: "",
      password: "",
      comment: "",
    },
    p: "sm",
  },
  [
    View({ tag: "fieldset" }, [
      View({ tag: "legend" }, "Send your Comment"),
      Row([
        Input({ name: "username", col: 6, label: "User Name" }),
        Input({ name: "password", col: 6, label: "Password" }),
        TextEditor({ name: "comment", label: "comment" }),
        Col({ col: 12 }, [
          View({border: true, borderColor: 'base-400', p: "sm",}, [
            View(["Username: ", View({ $text: "username" })]),
            View(["password: ", View({ $text: "password" })]),
            View(["edit: ", View({ $text: "comment" })]),
          ]),
        ]),
        Col({justify: 'end'}, [
          Button({ type: "submit", color: 'primary' }, "Submit"),

        ])
      ]),
    ]),
  ]
);
```
