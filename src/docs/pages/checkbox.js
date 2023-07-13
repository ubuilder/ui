import {
  Button,
  Checkbox,
  CheckboxGroup,
  Form,
  RadioGroup,
  View,
} from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

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
      { title: "Radio", description: "This is Radio component" },
      'Always use RadioGroup'
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
          value: ["Item 4"],
          label: "Choose items",
          items: ["Item 1", "Item 2", "Item 3", "Item 4"],
        }),

        Input({
          label: "Username",
          name: "username",
          value: "user",
        }),

        RadioGroup({
          name: "language",
          value: 3,
          label: "Choose a Language",
          text: (item) => item.text,
          key: (item) => item.id,
          items: [
            { text: "HTML", id: 1 },
            { text: "CSS", id: 2 },
            { text: "JS", id: 3 },
            { text: "Svelte", id: 4 },
          ],
          inline: true,
        }),

        Button({ color: "primary", type: "reset" }, "Reset"),
        Button({ color: "primary" }, "Submit"),
      ])
    ),
  ]);
}
