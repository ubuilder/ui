import {
  Button,
  ButtonGroup,
  Icon,
  Form,
  Input,
  View,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Select,
  Textarea,
} from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({ name: "Button" }, [
    Section({ title: "input" }, [Input({ value: "Hello" })]),
    Section({ title: "form" }, [
      Form([
        Input({ name: "username" }),
        Input({ name: "password" }),

        View({ border: true, p: "sm", mb: "sm" }, [
          View([
            View(["Username: ", View({ tag: "span", "u-text": "username" })]),
            View(["password: ", View({ tag: "span", "u-text": "password" })]),
          ]),
        ]),

        Button({ type: "submit" }, "Submit"),
      ]),
    ]),
    Section({ title: "form + checkbox" }, [
      Form([
        Input({ name: "username" }),
        Input({ name: "password" }),
        RadioGroup({
          name: "gender",
          label: "Gender",
          items: [
            { key: 1, text: "Male" },
            { key: 2, text: "Female" },
          ],
          key: "key",
          text: "text",
        }),
        Select({
            placeholder: 'Hello World!',
          name: "color",
        //   multiple: true,
        //   value: [2,3],
        label: 'Color',
          items: [
            { key: 1, name: "red" },
            { key: 2, name: "green" },
            { key: 3, name: "blue" },
          ],
          key: "key",
          text: (item) => item.name,
        }),
        Select({
            placeholder: 'Hello World!',
          name: "colors",
          multiple: true,
          value: [2,3],
        label: 'Colors',
          items: [
            { key: 1, name: "red" },
            { key: 2, name: "green" },
            { key: 3, name: "blue" },
          ],
          key: "key",
          text: (item) => item.name,
        }),
        Textarea({
            name: 'description',
            label: 'Description',
            value: 'This is description',
            placeholder: 'Enter Description...'
        }),
        CheckboxGroup({
          name: "group",
          items: ["one", "two", "three", "four"],
          value: ['one','three'],
          label: "Checkbox group",
        }),
        Checkbox({ name: "remember_me", text: "Remember me" }),

        View({ border: true, p: "sm", mb: "sm" }, [
          View([
            View(["Username: ", View({ tag: "span", "u-text": "username" })]),
            View(["password: ", View({ tag: "span", "u-text": "password" })]),
            View([
              "Remember Me: ",
              View({ tag: "span", "u-text": "remember_me" }),
            ]),
            View(["Gender: ", View({ tag: "span", "u-text": "gender" })]),
            View(["Color: ", View({ tag: "span", "u-text": "color" })]),
            View(["Colors: ", View({ tag: "span", "u-text": "JSON.stringify(colors)" })]),

            View(['Description: ', View({tag: 'span', 'u-text': 'description'})]),
            View([
              "Group: ",
              View({ tag: "span", "u-text": "JSON.stringify(group)" }),
            ]),
            View([
              "Selected: ",
              View({ tag: "span", "u-text": "group.length" }),
            ]),
          ]),
        ]),

        Button({ type: "submit", color: "primary" }, "Submit"),
      ]),
    ]),
  ]);
}
