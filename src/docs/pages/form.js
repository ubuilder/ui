import { Col, Container } from "../../components/GridSystem.js";
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
  Switch,
} from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({ name: "Button" }, [
    Section({ title: "input" }, [Input({ value: "Hello" })]),
    Section({ title: "form" }, [
      Container({size: 'xl', mx: 'auto'},[
        Form([
          Input({ name: "username", col: 6 }),
          Input({ name: "password", col: 6 }),

          Col({ border: true, p: "sm", mb: "sm" }, [
            View([
              View(["Username: ", View({ tag: "span", $text: "username" })]),
              View(["password: ", View({ tag: "span", $text: "password" })]),
            ]),
          ]),

          Button({ type: "submit" }, "Submit"),
        ]),
      ])

    ]),
    Section({ title: "form + checkbox" }, [
      Container({size: 'xl', mx: 'auto'}, [

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
        Input({col: 6, label: 'Input'}),
        Select({
            placeholder: 'Hello World!',
          name: "color",
          col: 6,
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
          colSm: 6,
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
            colSm: 6,
            name: 'description',
            label: 'Description',
            value: 'This is description',
            placeholder: 'Enter Description...'
        }),
        Switch({name: 'required', label: 'is this field required?'}),
        CheckboxGroup({
          name: "group",
          items: ["one", "two", "three", "four"],
          value: ['one','three'],
          label: "Checkbox group",
        }),
        Checkbox({ name: "remember_me", text: "Remember me" }),

        Col({ col: 12, border: true, p: "sm", mb: "sm" }, [
          View([
            View(["Username: ", View({ tag: "span", $text: "username" })]),
            View(["password: ", View({ tag: "span", $text: "password" })]),
            View([
              "Remember Me: ",
              View({ tag: "span", $text: "remember_me" }),
            ]),
            View(["Gender: ", View({ tag: "span", $text: "gender" })]),
            View(["Color: ", View({ tag: "span", $text: "color" })]),
            View(["Colors: ", View({ tag: "span", $text: "JSON.stringify(colors)" })]),

            View(['Description: ', View({tag: 'span', $text: 'description'})]),
            View(['Required: ', View({tag: 'span', $text: 'required'})]),
            View([
              "Group: ",
              View({ tag: "span", $text: "JSON.stringify(group)" }),
            ]),
            View([
              "Selected: ",
              View({ tag: "span", $text: "group.length" }),
            ]),
          ]),
        ]),

        Switch({mb: 0}),

        Button({ type: "submit", color: "primary" }, "Submit"),
      ]),
    ])

    ]),
    Section({title: 'Initial Value'}, [
      Form({ value: {name: 'user', remember: true, password: 'secret', gender: 'female', description: 'hello', languages: 'css'}}, [
        Input({name: 'name', label: 'Name'}),
        Input({name: 'password', type: 'password', label: 'Password'}),
        Textarea({name: 'description', label: 'description' }),
        Checkbox({name: 'remember', text: 'Remember Me'}),
        // CheckboxGroup({ name: 'languages', items: ['html', 'css', 'js', 'svelte']}),
        RadioGroup({ name: 'languages', items: ['html', 'css', 'js', 'svelte']}),
        Select({ name: 'gender', placeholder: "Select gender...", items: ['male', 'female']}),
        // Select({ name: 'languages', multiple: true, placeholder: "Select language...", items: ['html', 'css', 'js', 'svelte']}),
        Button({type: 'submit', color: 'primary'}, 'Submit')
      ])
    ]),
    Section({title: 'Funtion call', description: 'You can call javascript function by setting method to FUNCTION, in action you can write your function ($value is the value of form elements) '}, [
      Form({ method: 'FUNCTION', action: 'console.log($value)'}, [
        Input({name: 'name', label: 'Name'}),
        Input({name: 'password', type: 'password', label: 'Password'}),
        Textarea({name: 'description', label: 'description' }),
        Switch({name: 'remember', label: 'Remember Me'}),
        // CheckboxGroup({ name: 'languages', items: ['html', 'css', 'js', 'svelte']}),
        RadioGroup({ name: 'languages', items: ['html', 'css', 'js', 'svelte']}),
        Select({ name: 'gender', placeholder: "Select gender...", items: ['male', 'female']}),
        // Select({ name: 'languages', multiple: true, placeholder: "Select language...", items: ['html', 'css', 'js', 'svelte']}),
        Button({type: 'submit', color: 'primary'}, 'Submit')
      ])
      
    ]),

    Section({title: 'GET/POST Helpers'}, [
      Form({method: 'FUNCTION', action: `$get('/form', $value).then(res => alert('Successfully logged in'))`}, [
        Input({name: 'username', label: 'Username'}),
        Input({name: 'password', label: 'Password', type: 'password'}),
        Button({color: 'primary'}, 'Login')
      ])
    ])


  ]);
}
