import { Accordion, Accordions } from "../../src/Accordion.js";
import { Button, ButtonGroup } from "../../src/Button.js";
import { Card, CardActions, CardBody, CardFooter } from "../../src/Card.js";
import { View } from "../../src/View.js";
import { DocPage } from "../components/DocPage.js";

let value = "initial";

function Input($props, slots) {
  const { value, component = "input", type, label, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    tag: "input",
  };

  if (!value) {
    if (type === "number") {
      props.value = 0;
    } else {
      props.value = "";
    }
  }

  return View({ component: component + "-wrapper" }, [
    label && View({ tag: "label", component: "label" }, label),
    View(props, slots),
  ]);
}

export default function () {
  return DocPage({ name: "Accordion Example" }, [
    Card({ title: "Card" }, [
      CardBody({}, [
        Accordions({ persistent: true }, [
          Accordion({
            header: [
              "Hello",
              Button(
                {
                  color: "primary",
                  onClick() {
                    alert("click on button");
                  },
                },
                "Hi"
              ),
            ],
            body: [
              Input({
                value,
                label: "Name",
              }),
              Input({
                value,
                label: "Username",
              }),
              Input({
                value,
                label: "Age",
              }),
            ],
          }),
          Accordion({
            header: "Hello",
            body: [
              Input({
                value,
                label: "Name",
              }),
              Input({
                value,
                label: "Username",
              }),
              Input({
                value,
                label: "Age",
              }),
            ],
          }),
          Accordion({
            header: "Hello",
            body: [
              Input({
                value,
                label: "Name",
              }),
              Input({
                value,
                label: "Username",
              }),
              Input({
                value,
                label: "Age",
              }),

              Accordions({ persistent: true }, [
                Accordion({
                  header: [
                    "Hello",
                    Button(
                      {
                        color: "primary",
                        onClick() {
                          alert("click on button");
                        },
                      },
                      "Hi"
                    ),
                  ],
                  body: [
                    Input({
                      value,
                      label: "Name",
                    }),
                    Input({
                      value,
                      label: "Username",
                    }),
                    Input({
                      value,
                      label: "Age",
                    }),
                  ],
                }),
                Accordion({
                  header: "Hello",
                  body: [
                    Input({
                      value,
                      label: "Name",
                    }),
                    Input({
                      value,
                      label: "Username",
                    }),
                    Input({
                      value,
                      label: "Age",
                    }),
                  ],
                }),
                Accordion({
                  header: "Hello",
                  body: [
                    Input({
                      value,
                      label: "Name",
                    }),
                    Input({
                      value,
                      label: "Username",
                    }),
                    Input({
                      value,
                      label: "Age",
                    }),
                  ],
                }),
              ]),
            ],
          }),
        ]),
        View({ tag: "p", mt: "md" }, [
          Input({
            value,
            label: "Text:",
            placeholder: "Type Something...",
            onInput(e) {
              value = e.target.value;
            },
          }),
        ]),
      ]),
      CardFooter({}, [
        CardActions({}, [
          ButtonGroup({}, [
            Button({ link: true }, "Cancel"),
            Button(
              {
                color: "primary",
                onClick() {
                  alert("input value is: " + value);
                },
              },
              "Next"
            ),
            ,
          ]),
        ]),
      ]),
    ]),
  ]);
}
