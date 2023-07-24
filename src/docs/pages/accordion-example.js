import {
  Accordion,
  AccordionBody,
  Accordions,
} from "../../components/Accordion.js";
import { Button, ButtonGroup } from "../../components/Button.js";
import {
  Card,
  CardActions,
  CardBody,
  Input,
  CardFooter,
} from "../../components/index.js";
import { View } from "../../components/View.js";
import { DocPage } from "../components/DocPage.js";

let value = "";

export default function () {
  return DocPage({ name: "Accordion Example" }, [
    Card({ title: "Card",$data: {value: ''} }, [
      CardBody({}, [
        Accordions({ persistent: false }, [
          Accordion({
            header: [
              "Hello",
              Button(
                {
                  color: "primary",
                  onClick: `alert('click on button')`,
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
                        id: "button-new-project",
                        color: "primary",
                        // onClick: `console.log('HELLO', $event, $el)`,
                        onInit: `console.log('HELLO', $el)`,
                      },
                      "Hi"
                    ),

                    // ---- generated component
                    // (function ($el){
                    //   $el.addEventListener('click', ($event) => {
                    //     // ------- user code
                    //     console.log('HELLO', $event, $el)
                    //     // ----- end user code
                    //   })
                    // }())
                    // // ----- end component
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
                  body: AccordionBody([
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
                  ]),
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
            onInput: "value = $event.target.value",
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
                onClick: `alert('input value is: ' + value)`,
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
