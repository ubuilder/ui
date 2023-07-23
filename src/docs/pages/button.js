import { Button, ButtonGroup, Icon, View } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({ name: "Button" }, [
    Section({ title: "Button", description: "This is Button component" }),
    Section({
      title: "Button.Group",
      description: "This is ButtonGroup component",
    }),
    Section(
      {
        title: "With Icon",
        description: "You can use tabler-icons.io to get icon that you want",
      },
      [
        ButtonGroup({}, [
          Button({ color: "primary" }, [Icon("home"), "Left"]),
          Button({ color: "primary" }, ["Right", Icon("home") ]),
          Button({ color: "primary" }, [
            Icon("home" ),
            "Both",
            Icon("check" ),
          ]),
          Button({ color: "primary" }, [
            Icon("home" ),
            Icon("check" ),
          ]),
          Button({ color: "primary" }, Icon("check")),
        ]),
      ]
    ),
    Section(
      { title: "Sizes", description: "Button component supports these sizes" },
      [
        Button({ color: "primary", size: "sm" }, [
          Icon("check" ),
          "Small (sm)",
        ]),
        Button({ color: "primary", size: "md" }, [
          Icon("check" ),
          "Medium (md)",
        ]),
        Button({ color: "primary", size: "lg" }, [
          Icon("check" ),
          "Large (lg)",
        ]),
        Button({ color: "primary", size: "xl" }, [
          Icon("check" ),
          "Extra Large (xl)",
        ]),
      ]
    ),
    Section(
      {
        title: "Colors",
        description: "Button component supports these colors",
      },
      [
        ButtonGroup({}, [
          Button({ color: "primary" }, [Icon("check"), "Primary"]),
          Button({ color: "secondary" }, [
            Icon("check" ),
            "Secondary",
          ]),
          Button({ color: "success" }, [Icon("check"), "Success"]),
          Button({ color: "error" }, [Icon("check"), "Error"]),
          Button({ color: "warning" }, [Icon("check"), "Warning"]),
          Button({ color: "info" }, [Icon("check"), "Info"]),
          Button({ color: "dark" }, [Icon("check"), "Dark"]),
          Button({ color: "light" }, [Icon("check"), "Light"]),
        ]),
      ]
    ),
  ]);
}
