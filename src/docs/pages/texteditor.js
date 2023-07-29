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
        title: "default",
        description: "this simple text editor with default values",
      },
      Preview({ code: `TextEditor()` })
    ),

    Section(
      {
        title: "type",
        description: "basic is the simplest type",
      },
      Preview({ code: `TextEditor({type: 'basic'})` })
    ),
    Section(
      {
        title: "type",
        description: "default is simple",
      },
      Preview({ code: `TextEditor({type: 'simple'})` })
    ),
    Section(
      {
        title: "type",
        description: "standard",
      },
      Preview({ code: `TextEditor({type: 'standard'})` })
    ),
    Section(
      {
        title: "type",
        description: "advanced",
      },
      Preview({ code: `TextEditor({type: 'advanced'})` })
    ),

    Section(
      {
        title: "value",
        description: "we can set a primary value",
      },
      Preview({ code: `TextEditor({value: 'hellow world!'})` })
    ),

    Section(
      {
        title: "label",
        description: "like rest of form element it can have label",
      },
      Preview({ code: `TextEditor({label: 'comment'})` })
    ),
    Section(
      {
        title: "placeholder",
        description: "like rest of form element it can have placeholder",
      },
      Preview({
        code: `TextEditor({placeholder: 'please write your comments...'})`,
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
        title: "tow way value binding",
        description:
          "with $model we can bind the value of editor with some variable",
      },
      Preview({
        code: `[
        View({$data: {comment: ''}},[
          Button({onClick: "comment= ''; console.log('reseted')" }, 'reset'),
          View({$text: 'comment'}),
          TextEditor({$model: 'comment'}),
        ]),
      ]`,
      })
    ),
    Section(
      {
        title: "in form",
        description:
          "just like other form element it can send the form data, under the hood it acts as textarea tag",
      },
      Preview({
        code: `Form(
        [
          Input({  col: 6, label: "User Name",  }),
          Input({  col: 6, label: "email", }),
          TextEditor({  label: "comment" }),
  
          Button({ type: "submit" }, "Submit"),
        ]
      )`,
      })
    ),
    Section(
      {
        title: "in a form with $data binding",
        description: "the data of the form inputs can be send to backend",
      },
      Preview({
        code: `Form(
        {
          $data: {
            username: "",
            password: "",
            comment: "",
          },
        },
        [
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
      TextEditor()
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
      TextEditor({ type: "basic" })
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
