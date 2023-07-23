import { Button } from "../../components/Button.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Preview } from "../components/Preview.js";
import { Tooltip } from "../../components/Tooltip.js";
import { View } from "../../components/View.js";

export default function () {
  return DocPage({ name: "Tooltip" }, [
    Section({ title: "Tooltip", description: "simple Tooltip" }, [
      Preview({
        code: `Button(["Login", Tooltip("Hi, Welcome!")])`,
      }),
    ]),
    Section({ title: "Arrow", description: "by default it has arrow" }, [
      Preview({
        code: `Button(["no arrow", Tooltip({ arrow: false }, "Hi, Welcome!")])`,
      }),
    ]),
    Section(
      {
        title: "Placement",
        description:
          "The default value is bottom, this also support rest of mixed placemnts like: top-start and so.",
      },
      [
        Preview({
          code: `Button([
                "bottom",
                Tooltip({ placement: "bottom" }, "Hi, Welcome!"), //default is bottom
              ]),
              Button(["top", Tooltip({ placement: "top" }, "Hi, Welcome!")]),
              Button(["left", Tooltip({ placement: "left" }, "Hi, Welcome!")]),
              Button(["right", Tooltip({ placement: "right" }, "Hi, Welcome!")]),
            `,
        }),
      ]
    ),
    Section(
      { title: "trigger", description: "by default the trigger is hover" },
      [
        Preview({
          code: `
            [
              Button(["hover", Tooltip({}, "Hi, Welcome!")]),
              Button(["click", Tooltip({ trigger: "click" }, "Hi, Welcome!")]),
            ]
        
  `,
        }),
      ]
    ),
    Section(
      {
        title: "Compunent in side",
        description: "it also can take components",
      },
      [
        Preview({
          code: `
  View({style: 'width: max-content;border: 2px solid gray', }, [
    "action",
    Tooltip({}, [
      View([
        Button({ color: "error" }, "cancel"),
        Button({ color: "primary" }, "ok"),
      ]),
    ]),
  ]),
  `,
        }),
      ]
  ),
    Section(
      {
        title: "Different Target component",
        description:
          "You can change target element by changing 'target' property, supports css like selectors",
      },
      [
        Preview({
          code: `[
  Button({ id: "my-button" }, "action"),
  Tooltip({ target: "#my-button" }, "This tooltip is not child of the button"),
          ]`,
        }),
      ]
    ),
  ]);
}
