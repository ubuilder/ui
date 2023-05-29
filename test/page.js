import { Accordion, Accordions } from "../src/Accordion.js";
import { Button, ButtonGroup } from "../src/Button.js";
import { Card, CardActions, CardBody, CardFooter } from "../src/Card.js";
import { View } from "../src/View.js";

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

let value;
let components = {
  button: Button({ color: "secondary" }, "Secondary"),
  accordion: Accordions({ m: "sm" }, [
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
      body: "AccordionBody",
    }),
    Accordion({
      header: "Hello",
      body: "AccordionBody",
    }),
  ]),
  card: Card({ title: "First Card" }, [
    CardBody({}, [
      Accordions({}, [
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
          body: "AccordionBody",
        }),
        Accordion({
          header: "Hello",
          body: "AccordionBody",
        }),
      ]),
      View({ tag: "p", mt: "md" }, [
        Input({
          value,
          label: "Hello",
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
};

export default function ({ name }) {
  return View({ p: "md" }, [
    View({ p: "sm" }, [
      Button(
        {
          color: "dark",
          onClick() {
            //
            document.body.classList.toggle("dark");
            console.log("onClick");
            this.classList.toggle("u-button-color-dark");
            this.classList.toggle("u-button-color-light");
          },
        },
        "dark"
      ),
    ]),
    components[name ?? "button"],
  ]);
}
