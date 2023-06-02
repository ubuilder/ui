import { renderScripts, renderTemplate, html } from "@ulibs/router";
import { Button, View } from "../../components/index.js";

// const prefix = "/";
const prefix = "/components/";

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
          onClick: `document.body.classList.toggle("dark")`,
        },
        "Dark"
      ),
    ]),
    name && View({ tag: "h1", ps: "sm", my: "md" }, name),
    View({ p: "sm" }, slots),
  ]);

  const template = renderTemplate(page);
  const script = renderScripts(page);

  const scriptGlobal = View({ tag: "script", src: prefix + "ulibs.js" });
  const style = View({
    tag: "link",
    rel: "stylesheet",
    href: prefix + "styles.css",
  });
  const title = View({ tag: "title" }, `UBuilder / Components / ` + name);

  const customCss = `
  .border-bottom {
    box-shadow: 0 1px 1px -1px var(--color-base-content);
  }`;

  console.log(script);
  return html({
    head: [title, style, View({ tag: "style" }, customCss)],
    body: [template, scriptGlobal, script && View({ tag: "script" }, script)],
  });
}
