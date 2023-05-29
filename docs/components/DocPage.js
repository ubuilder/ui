import { renderScripts, renderTemplate, html } from "@ulibs/router";
import { Button } from "../../src/Button.js";
import { View } from "../../src/View.js";

export function DocPage(
  { component = "page", name = "", ...restProps },
  slots
) {
  const page = View({ component, ...restProps }, [
    View({ p: "xs", class: "border-bottom" }, [
      Button({ link: true, href: "/components" }, "Back"),
      Button(
        {
          color: "dark",
          onClick() {
            document.body.classList.toggle("dark");
          },
        },
        "Dark"
      ),
    ]),
    name && View({ tag: "h1", ps: "sm", my: "md" }, name),
    View({ p: "sm" }, slots),
  ]);

  const template = renderTemplate(page);
  const script = renderScripts(page);
  const style = View({ tag: "link", rel: "stylesheet", href: "/styles.css" });
  const title = View({ tag: "title" }, `UBuilder / Components / ` + name);

  const customCss = `
  .border-bottom {
    box-shadow: 0 1px 1px -1px var(--color-base-content);
  }`;

  return html({
    head: [title, style, View({ tag: "style" }, customCss)],
    body: [template, script && View({ tag: "script" }, script)],
  });
}
