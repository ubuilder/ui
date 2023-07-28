import { Col, Row } from "../../components/GridSystem.js";
import { View } from "../../components/View.js";
import { Input, Button, Switch, Container, Card, Checkbox, CheckboxGroup, RadioGroup, Select, Textarea, CardBody } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default () =>
  DocPage({ name: "Dynamic Form" }, [
    Section({ title: "Simple" }, [
      View({ $data: { name: "initial name", username: "initial username" } }, [
        Input({ name: "name", label: "Name" }),
        Input({ name: "username", label: "Username" }),
        Button({ onClick: "console.log({name, username})" }, "Submit"),
      ]),
    ]),
    Section({ title: "With Array" }, [
      Container({ size: "xl", mx: "auto" }, [
        View(
          {
            $data: {
              newTodo: "",
              todos: [
                { title: "todo 1", description: 'text 1', done: false, required:  false, color: 'red', colors: ['green', 'blue'], languages: ['a'], abc: 'a' },
                { title: "todo 2", description: 'text 2', done: false, required:  false, color: 'red', colors: ['green', 'blue'], languages: ['a'], abc: 'b' },
                { title: "todo 3", description: 'text 3', done: true, required:  true, color: 'red', colors: ['green', 'blue'], languages: ['a'], abc: 'c' },
              ],
            },
          },
          [
            Card([
              View(
                { $for: "todo in todos" },
                Row({ p: "xs" }, [
                  Input({ col: true, name: "todo.title", label: "title" }),
                  Switch({ col: 0, name: "todo.done", label: "Done" }),
                  Checkbox({name: 'todo.required', label: 'Required?'}),
                  CheckboxGroup({name: 'todo.languages', label: 'Languages', items: ['a', 'b', 'c']}),
                  RadioGroup({name: 'todo.abc', label: 'Abc', items: ['a', 'b', 'c']}),
                  Select({name: 'todo.color', label: 'Color', items: ['red', 'green', 'blue']}),
                  Select({name: 'todo.colors', label: 'Colors', multiple: true, items: ['red', 'green', 'blue']}),
                  Textarea({name: 'todo.description', label: 'Description'}),
                  Col({col: 0, alignSelf: 'end'},[Button({ onClick: "todos.splice(index, 1)" }, "Remove")]),
                ])
              ),
            ]),

            Card([CardBody([
              Input({ name: "newTodo", label: "New Todo: " }),
              Button(
                {
                  onClick:
                    "todos.push({title: newTodo, done: false, languages: []}); newTodo = ``",
                },
                "Add Todo"
              ),
            ]),
            ]),



            Button({ onClick: "console.log(Alpine.raw(todos))" }, "Submit"),
          ]
        ),
      ]),
    ]),
  ]);
