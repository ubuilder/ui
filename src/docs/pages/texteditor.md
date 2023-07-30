# TextEditor

## default Texteditor

this simple text editor with default values

```js
TextEditor();
```

## Texteditor type

type determine the number of options in toolbar.

type accepted value are: basic, simple, standard, advanced

- basic
- simple the defalut value
- standard
- advanced

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

## value

```js
TextEditor({ value: "write your comment", h: "6xl", me: "lg", mb: "lg" });
```

## label and placehoder

```js
TextEditor({
  placeholder: "write your comment",
  label: "comment",
  h: "6xl",
  me: "lg",
  mb: "lg",
});
```

## value binding

with $model we can bind the value of editor with some variable

```js
View({ $data: { comment: "" } }, [
  View({ $text: "comment" }),
  TextEditor({ $model: "comment", h: "6xl", me: "lg", mb: "lg" }),
]);
```

## value binding

with $model we can bind the value of editor with some variable

```js
View({$data: {comment: ''}},[
    Button({onClick: "comment= ''" }, 'reset comment'),
    View({$text: 'comment'}),
    TextEditor({$model: 'comment', h: '6xl', me: 'lg', mb: 'lg'}),
]),
```

## texteditor in form

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

## texteditor in a form with name and $data binding

just like rest of form inputs texteditor value can be bound with form $data

```js
 Form({
    $data: {
    username: "",
    password: "",
    comment: "",
    },
    p: 'sm',
},[

    View({tag: 'fieldset'},[
    View({tag: 'legend'}, 'Send your Comment'),
    Input({ name: "username", col: 6, label: "User Name",  }),
    Input({ name: "password", col: 6, label: "Password", }),
    TextEditor({ name: "comment", label: "comment" }),
    Col({ border: true, p: "sm", style: "width:100%" }, [
    View([
        View(["Username: ", View({ tag: "span", $text: "username" })]),
        View(["password: ", View({ tag: "span", $text: "password" })]),
        View(["edit: ", View({ tag: "span", $text:  "comment" })]),
    ]),
    ]),
    Button({ type: "submit" }, "Submit"),
    ])
])
```


<!--

// import { DocPage } from "../components/DocPage.js";
// import { Section } from "../components/Section.js";
// import { Preview } from "../components/Preview.js";
// import {
//   View,
//   Form,
//   Input,
//   Col,
//   Button,
//   TextEditor,
//   Textarea,
// } from "../../components/index.js";

// export default function () {
//   return DocPage({ name: "Popover" }, [
//     Section(
//       {
//         title: "default Texteditor",
//         description: "this simple text editor with default values",
//       },
//       Preview({ code: `TextEditor()` })
//     ),

//     Section(
//       {
//         title: "type attribute",
//         description: "basic is the simplest type with least options",
//       },
//       Preview({ code: `TextEditor({type: 'basic'})` })
//     ),
//     Section(
//       {
//         title: "type",
//         description: "default type is 'simple'",
//       },
//       Preview({ code: `TextEditor({type: 'simple'})` })
//     ),
//     Section(
//       {
//         title: "type",
//         description: "standard, it has more options",
//       },
//       Preview({ code: `TextEditor({type: 'standard'})` })
//     ),
//     Section(
//       {
//         title: "type",
//         description: "advanced, it is fully fitured",
//       },
//       Preview({ code: `TextEditor({type: 'advanced'})` })
//     ),

//     Section(
//       {
//         title: "value attribute",
//         description: "we can set a primary value",
//       },
//       Preview({ code: `TextEditor({value: 'hellow world!'})` })
//     ),
//     Section(
//       {
//         title: "placeholder and Label",
//         description:
//           "like rest of form element it can have placeholder and label",
//       },
//       Preview({
//         code: `TextEditor({placeholder: 'please write your comments...', label: 'comment'})`,
//       })
//     ),
//     Section(
//       {
//         title: "value binding",
//         description:
//           "with $model we can bind the value of editor with some variable",
//       },
//       Preview({
//         code: `[
//         View({$data: {comment: ''}},[
//           View({$text: 'comment'}),
//           TextEditor({$model: 'comment'})
//         ])
//       ]`,
//       })
//     ),
//     Section(
//       {
//         title: "value binding",
//         description:
//           "with $model we can bind the value of editor with some variablea",
//       },
//       Preview({
//         code: `[
//         View({$data: {comment: ''}},[
//           Button({onClick: "comment= ''" }, 'reset comment'),
//           View({$text: 'comment'}),
//           TextEditor({$model: 'comment'}),
//         ]),
//       ]`,
//       })
//     ),
//     Section(
//       {
//         title: "texteditor in form",
//         description:
//           "just like other form element it can send the form data, under the hood it acts as textarea tag",
//       },
//       Preview({
//         code: `
//         Form({p: 'sm'},[
//           View({tag: 'fieldset'},[
//             View({tag: 'legend'}, 'Send your comment'),
//             Input({  col: 12, label: "User Name",  }),
//           Input({  col: 12, label: "email", }),
//           TextEditor({ col: 12,  label: "comment" }),

//           Button({ type: "submit" }, "Submit"),
//           ])
//         ])
//         `,
//       })
//     ),
//     Section(
//       {
//         title: "texteditor in a form with name and  $data binding",
//         description:
//           "just like rest of form inputs texteditor value can be bound with $data",
//       },
//       Preview({
//         code: `
//         Form(
//         {
//           $data: {
//             username: "",
//             password: "",
//             comment: "",
//           },
//           p: 'sm'
//         },
//         [
//           View({tag: 'fieldset'},[
//             View({tag: 'legend'}, 'Send your Comment'),
//             Input({ name: "username", col: 6, label: "User Name",  }),
//           Input({ name: "password", col: 6, label: "Password", }),
//           TextEditor({ name: "comment", label: "comment" }),
//           Col({ border: true, p: "sm", style: "width:100%" }, [
//             View([
//               View(["Username: ", View({ tag: "span", $text: "username" })]),
//               View(["password: ", View({ tag: "span", $text: "password" })]),
//               View(["edit: ", View({ tag: "span", $text:  "comment" })]),
//             ]),
//           ]),
//           Button({ type: "submit" }, "Submit"),
//           ])
//         ]
//       )`,
//       })
//     ),
//
//
//     //sections
//   ]);
// }
-->

