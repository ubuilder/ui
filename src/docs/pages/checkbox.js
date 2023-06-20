import {
  Button,
  Checkbox,
  CheckboxGroup,
  Form,
  Icon,
  Input,
  View,
} from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { tag } from "@ulibs/router";

// function Icon({ name }) {
//   return View({
//     tag: "span",
//     onMount($el, props) {
//       fetch(`https://unpkg.com/@tabler/icons@2.19.0/icons/${props}.svg`)
//         .then((res) => res.text())
//         .then((svg) => {
//           $el.outerHTML = svg.replace("icon icon-tabler", "u-icon");
//         });
//     },
//     component: "icon",
//     jsProps: name,
//   });
// }

export default function () {
  return DocPage({ name: "Checkbox" }, [
    Section(
      { title: "Checkbox", description: "This is Checkbox component" },
      View([
        Checkbox({ name: "remember", label: "Remember Me" }),
        Checkbox({ name: "remember", label: "Remember Me" }),
      ]),
      View([
        Checkbox({ name: "language", inline: true, label: "Html" }),
        Checkbox({ name: "language", inline: true, label: "Css" }),
        Checkbox({ name: "language", inline: true, label: "Js" }),
      ])
    ),
    Section(
      {
        title: "Checkbox.Group",
        description: "This is CheckboxGroup component",
      },

      Form({ method: "POST", action: "create" }, [
        CheckboxGroup({
          label: "Choose items",
          name: "items-1",
          items: ["Item 1", "Item 2", "Item 3", "Item 4"],
          inline: true,
        }),

        CheckboxGroup({
          name: "items-2",

          label: "Choose items",
          items: ["Item 1", "Item 2", "Item 3", "Item 4"],
        }),

        Input({
          label: "Username",
          name: "username",
          value: "user",
        }),

        CheckboxGroup({
          name: "items-3",
          value: ["Item 3", "Item 2"],
          label: "Choose items",
          items: ["Item 1", "Item 2", "Item 3", "Item 4"],
          inline: true,
        }),

        Button({ color: "primary", type: "reset" }, "Reset"),
        Button({ color: "primary" }, "Submit"),
      ])
    ),
  ]);
}
