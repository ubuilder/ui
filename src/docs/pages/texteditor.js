import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Preview } from "../components/Preview.js";
import {
  View,
  Form,
  Input,
  Col,
  Button,
  TextEditor,
  Textarea,
} from "../../components/index.js";

export default function () {
  return DocPage({ name: "Popover" }, [
    Section(
      {
        title: "default Texteditor",
        description: "this simple text editor with default values",
      },
      Preview({ code: `TextEditor()` })
    ),

    Section(
      {
        title: "type attribute",
        description: "basic is the simplest type with least options",
      },
      Preview({ code: `TextEditor({type: 'basic'})` })
    ),
    Section(
      {
        title: "type",
        description: "default type is 'simple'",
      },
      Preview({ code: `TextEditor({type: 'simple'})` })
    ),
    Section(
      {
        title: "type",
        description: "standard, it has more options",
      },
      Preview({ code: `TextEditor({type: 'standard'})` })
    ),
    Section(
      {
        title: "type",
        description: "advanced, it is fully fitured",
      },
      Preview({ code: `TextEditor({type: 'advanced'})` })
    ),

    Section(
      {
        title: "value attribute",
        description: "we can set a primary value",
      },
      Preview({ code: `TextEditor({value: 'hellow world!'})` })
    ),
    Section(
      {
        title: "placeholder and Label",
        description:
          "like rest of form element it can have placeholder and label",
      },
      Preview({
        code: `TextEditor({placeholder: 'please write your comments...', label: 'comment'})`,
      })
    ),
    Section(
      {
        title: "value binding",
        description:
          "with $model we can bind the value of editor with some variable",
      },
      Preview({
        code: `[
        View({$data: {comment: ''}},[
          View({$text: 'comment'}),
          TextEditor({$model: 'comment'})
        ])
      ]`,
      })
    ),
    Section(
      {
        title: "value binding",
        description:
          "with $model we can bind the value of editor with some variablea",
      },
      Preview({
        code: `[
        View({$data: {comment: ''}},[
          Button({onClick: "comment= ''" }, 'reset comment'),
          View({$text: 'comment'}),
          TextEditor({$model: 'comment'}),
        ]),
      ]`,
      })
    ),
    Section(
      {
        title: "texteditor in form",
        description:
          "just like other form element it can send the form data, under the hood it acts as textarea tag",
      },
      Preview({
        code: `
        Form({p: 'sm'},[
          View({tag: 'fieldset'},[
            View({tag: 'legend'}, 'Send your comment'),
            Input({  col: 12, label: "User Name",  }),
          Input({  col: 12, label: "email", }),
          TextEditor({ col: 12,  label: "comment" }),
  
          Button({ type: "submit" }, "Submit"),
          ])
        ])
        `,
      })
    ),
    Section(
      {
        title: "texteditor in a form with name and  $data binding",
        description:
          "just like rest of form inputs texteditor value can be bound with $data",
      },
      Preview({
        code: `
        Form(
        {
          $data: {
            username: "",
            password: "",
            comment: "",
          },
          p: 'sm'
        },
        [
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
        ]
      )`,
      })
    ),
    View({ style: "color: blue" }, "=========> out side preview <=========="),

    Section(
      {
        title: "textEditor",
        description: "this simple text editor with default values",
      },
      TextEditor({style: 'height: 100px'})
    ),
    Section(
      {
        title: "type",
        description: "default",
      },
      TextEditor()
    ),
    Section(
      {
        title: "type",
        description: "basic",
      },
      TextEditor({ type: "basic", style: 'height: 100px' })
    ),
    Section(
      {
        title: "type",
        description: "simple",
      },
      TextEditor({ type: "simple" })
    ),
    Section(
      {
        title: "type",
        description: "standard",
      },
      TextEditor({ type: "standard" })
    ),
    Section(
      {
        title: "type",
        description: "advanced",
      },
      TextEditor({ type: "advanced" })
    ),
    Section(
      {
        title: "placeholder",
        description: "",
      },
      TextEditor({ placeholder: "type something" })
    ),
    Section(
      {
        title: "texteditor inside a from",
        description: "",
      },
      [
        Form({}, [
          Input({ col: 6, label: "User Name", value: "" }),
          Input({ col: 6, label: "Password", value: "" }),
          Textarea({ label: "comment", value: "" }),
          TextEditor({ label: "edit", value: "" }),
          Button({ type: "reset" }, "reset"),
          Button({ type: "submit" }, "Submit"),
        ]),
      ]
    ),
    Section(
      {
        title: "form $data",
        description: "this simple text editor with default values",
      },
      [
        Form(
          {
            $data: {
              username: "",
              password: "",
              comment: "",
              edit: "hellow",
            },
          },
          [
            Input({ name: "username", col: 6, label: "User Name" }),
            Input({ name: "password", col: 6, label: "Password" }),
            Textarea({ name: "comment", label: "comment" }),
            TextEditor({ name: "edit", label: "edit" }),

            Col({ border: true, p: "sm", mb: "sm" }, [
              View([
                View(["Username: ", View({ tag: "span", $text: "username" })]),
                View(["password: ", View({ tag: "span", $text: "password" })]),
                View(["comment: ", View({ tag: "span", $text: "comment" })]),
                View(["edit: ", View({ tag: "span", $text: "edit" })]),
              ]),
            ]),

            Button({ type: "reset" }, "reset"),
            Button({ type: "submit" }, "Submit"),
          ]
        ),
      ]
    ),
    Section(
      {
        title: "model",
        description: "",
      },
      [
        View({ $data: { name: "" } }, [
          View({ $text: "name" }),
          Button({ onClick: "name = ''" }, "resent"),
          TextEditor({ $model: "name" }),
        ]),
      ]
    ),

    //sections
  ]);
}
