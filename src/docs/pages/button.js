import { Button, ButtonGroup, View } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { tag } from "@ulibs/router";

function Icon({ name }) {
  return View({
    tag: "span",
    onMount($el, props) {
      fetch(`https://unpkg.com/@tabler/icons@2.19.0/icons/${props}.svg`)
        .then((res) => res.text())
        .then((svg) => {
          $el.outerHTML = svg.replace("icon icon-tabler", "u-icon");
        });
    },
    component: "icon",
    jsProps: name,
  });
}

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
          Button({ color: "primary" }, [Icon({ name: "home" }), "Left"]),
          Button({ color: "primary" }, ["Right", Icon({ name: "home" })]),
          Button({ color: "primary" }, [
            Icon({ name: "home" }),
            "Both",
            Icon({ name: "check" }),
          ]),
          Button({ color: "primary" }, [
            Icon({ name: "home" }),
            Icon({ name: "check" }),
          ]),
          Button({ color: "primary" }, [Icon({ name: "check" })]),
        ]),
      ]
    ),
    Section(
      { title: "Sizes", description: "Button component supports these sizes" },
      [
        Button({ color: "primary", size: "sm" }, [
          Icon({ name: "check" }),
          "Small (sm)",
        ]),
        Button({ color: "primary", size: "md" }, [
          Icon({ name: "check" }),
          "Medium (md)",
        ]),
        Button({ color: "primary", size: "lg" }, [
          Icon({ name: "check" }),
          "Large (lg)",
        ]),
        Button({ color: "primary", size: "xl" }, [
          Icon({ name: "check" }),
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
          Button({ color: "primary" }, [Icon({ name: "check" }), "Primary"]),
          Button({ color: "secondary" }, [
            Icon({ name: "check" }),
            "Secondary",
          ]),
          Button({ color: "success" }, [Icon({ name: "check" }), "Success"]),
          Button({ color: "error" }, [Icon({ name: "check" }), "Error"]),
          Button({ color: "warning" }, [Icon({ name: "check" }), "Warning"]),
          Button({ color: "info" }, [Icon({ name: "check" }), "Info"]),
          Button({ color: "dark" }, [Icon({ name: "check" }), "Dark"]),
          Button({ color: "light" }, [Icon({ name: "check" }), "Light"]),
        ]),
      ]
    ),
  ]);
}
