import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Preview } from "../components/Preview.js";
import {
  Popover,
  View,
  Container,
  Form,
  Input,
  Col,
  Button,
  Row,
} from "../../components/index.js";

export default function () {
  return DocPage({ name: "Popover" }, [
    Section(
      {
        title: "default",
        description: "the default values acts like this",
      },
      [
        Preview({
          code: `
  Button(["click me", Popover("Hi, it is popover")])`,
        }),
      ]
    ),
    Section(
      {
        title: "trigger",
        description: "default value is 'click', valuse is 'click' and 'hover' ",
      },
      [
        Preview({
          code: `
  Button(["hover me", Popover({trigger: 'hover'},"Hi, it is popover")])`,
        }),
      ]
    ),
    Section(
      {
        title: "persistant mode",
        description:
          "close or not close popover when hover over it, default value is 'true'",
      },
      [
        Preview({
          code: `
  Button(["hover, none-persistant", Popover({trigger: 'hover',persistant: false },"Hi, it is popover")])`,
        }),
      ]
    ),
    Section(
      {
        title: "arrow",
        description: "default is value is false",
      },
      [
        Preview({
          code: `
  Button(["hover, none-persistant, arrow", Popover({trigger: 'hover',persistant: false, arrow: true },"Hi, it is popover")])`,
        }),
      ]
    ),
    Section(
      {
        title: "placement",
        description:
          "default is 'bottom', values can be any of  top, bottom, ..., top-start, top-end,...",
      },
      [
        Preview({
          code: `
  Button(["hover, persistant, arrow, top", Popover({trigger: 'hover',persistant: true, arrow: true, placement: 'top' },"Hi, it is popover")]),
  Button(["hover, persistant, arrow, left", Popover({trigger: 'hover',persistant: true, arrow: true, placement: 'left' },"Hi, it is popover")]),
  Button(["hover, persistant, arrow, bottom", Popover({trigger: 'hover',persistant: true, arrow: true, placement: 'bottom' },"Hi, it is popover")]),
  Button(["hover, persistant, arrow, right", Popover({trigger: 'hover',persistant: true, arrow: true, placement: 'right' },"Hi, it is popover")]),
          `,
        }),
      ]
    ),
    Section(
      {
        title: "component inside",
        description: "components inside popover",
      },
      [
        Preview({
          code: `
  Button([
    "hover, persistant",
    Popover({ trigger: "hover", persistant: true }, [
      View([
        View("this is view1"),
        Popover({ trigger: "hover", persistant: true }, "popover"),
      ]),
      View([
        View("this is view2"),
        Popover({ trigger: "hover", persistant: true }, "popover"),
      ]),
    ]),
  ]),
          `,
        }),
      ]
    ),
    Section(
      {
        title: "focusable",
        description:
          "default value is true, in case of need you can make it false ",
      },
      [
        Preview({
          code: `
  Button([
    "tooltip only",
    Popover(
      { trigger: "hover", focusAble: false, arrow: true },
      Input({ name: "test" })
    ),
  ]),
          `,
        }),
      ]
    ),
    Section(
      {
        title: "component inside",
        description: "components inside popover",
      },
      [
        Preview({
          height: 500,
          code: `[
  View({ border: "sm", style: "width: max-content" }, [
    "hover, persistant",
    Popover({ trigger: "hover", persistant: "true" }, [
      Container({ size: "xl", style: 'max-width: 450px', mx: "auto", my: "sm" }, [
        View({ tag: "h3", my: "sm" }, "Login form"),

        Form([
          Input({ label: "Username", name: "username" }),
          Input({ label: "Password", name: "password" }),

          Col({col: 12}, [
            View({ border: true, p: "sm", mb: "sm" },[
                View([
                  "Username: ",
                  View({ tag: "span", "u-text": "username" }),
                ]),
                View([
                  "password: ",
                  View({ tag: "span", "u-text": "password" }),
                ]),
            ]),
          ]),

          Button({ type: "submit", color: "primary" }, "Submit"),
        ]),
      ]),
    ]),
  ]),
]`,
        }),
      ]
    ),

    //in development mode the Preview does not support
    View(
      { pt: "lg", pb: "lg", style: "color: red" },
      "&lt;=============-- with out preview --===========&gt"
    ),
    Section(
      {
        title: "default",
        description: "the default values acts like this",
      },
      [Button(["click me", Popover("Hi, it is popover")])]
    ),
    Section(
      {
        title: "trigger",
        description: "default value is 'click', valuse is 'click' and 'hover' ",
      },
      [Button(["hover me", Popover({ trigger: "hover" }, "Hi, it is popover")])]
    ),
    Section(
      {
        title: "persistant mode",
        description:
          "close or not close popover when hover over it, default value is 'true'",
      },
      [
        Button([
          "hover, none-persistant",
          Popover(
            { trigger: "hover", persistant: "false" },
            "Hi, it is popover"
          ),
        ]),
      ]
    ),
    Section(
      {
        title: "arrow",
        description: "default is value is false",
      },
      [
        Button([
          "hover, none-persistant, arrow",
          Popover(
            { trigger: "hover", persistant: "false", arrow: "true" },
            "Hi, it is popover"
          ),
        ]),
      ]
    ),
    Section(
      {
        title: "placement",
        description:
          "default is 'bottom', values can be any of  top, bottom, ..., top-start, top-end,...",
      },
      [
        Button([
          "hover, persistant, arrow, top",
          Popover(
            {
              trigger: "hover",
              persistant: "true",
              arrow: "true",
              placement: "top",
            },
            "Hi, it is popover"
          ),
        ]),
        Button([
          "hover, persistant, arrow, left",
          Popover(
            {
              trigger: "hover",
              persistant: "true",
              arrow: "true",
              placement: "left",
            },
            "Hi, it is popover"
          ),
        ]),
        Button([
          "hover, persistant, arrow, bottom",
          Popover(
            {
              trigger: "hover",
              persistant: "true",
              arrow: "true",
              placement: "bottom",
            },
            "Hi, it is popover"
          ),
        ]),
        Button([
          "hover, persistant, arrow, right",
          Popover(
            {
              trigger: "hover",
              persistant: "true",
              arrow: "true",
              placement: "right",
            },
            "Hi, it is popover"
          ),
        ]),
      ]
    ),

    Section(
      {
        title: "component inside",
        description: "components inside popover",
      },
      [
        Button([
          "hover, persistant",
          Popover({ trigger: "hover", persistant: "true" }, [
            View([
              View("this is view1"),
              Popover({ trigger: "hover", persistant: "true" }, "popover"),
            ]),
            View([
              View("this is view2"),
              Popover({ trigger: "hover", persistant: "true" }, "popover"),
            ]),
          ]),
        ]),
      ]
    ),
    Section(
      {
        title: "focusable",
        description:
          "defaultvalue is true, in case of need you can make it false ",
      },
      [
        Button([
          "tooltip only",
          Popover(
            { trigger: "hover", focusAble: false, arrow: true },
            Input({ name: "test" })
          ),
        ]),
      ]
    ),

    Section(
      {
        title: "form inside",
      },
      [
        View({ border: "sm", style: "width: max-content" }, [
          "hover, persistant",
          Popover({ trigger: "hover", persistant: "true" }, [
            Container({ size: "xl", style: 'max-width: 450px', mx: "auto", my: "sm" }, [
              View({ tag: "h3", my: "sm" }, "Login form"),

              Form([
                Input({ label: "Username", name: "username" }),
                Input({ label: "Password", name: "password" }),

                Col({col: 12}, [
                  View({ border: true, p: "sm", mb: "sm" },[
                      View([
                        "Username: ",
                        View({ tag: "span", "u-text": "username" }),
                      ]),
                      View([
                        "password: ",
                        View({ tag: "span", "u-text": "password" }),
                      ]),
                  ]),
                ]),

                Button({ type: "submit", color: "primary" }, "Submit"),
              ]),
            ]),
          ]),
        ]),
      ]
    ),
  ]);
}
