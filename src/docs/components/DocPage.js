import { Container } from "../../components/GridSystem.js";
import { Button, View } from "../../components/index.js";
import { tag } from "../../core/tags.js";

export function DocPage(
  { component = "page", theme="dark", name = "", host, prefix = "/ui/", ...restProps },
  slots
) {

  const style = View({
    tag: "link",
    rel: "stylesheet",
    href: prefix + "styles.css",
  });
  const title = View({ tag: "title" }, `UBuilder / Components / ` + name);

  const customCss = `
  .header {
    background-color: var(--color-base-200);
  }

  .border-bottom {
    border-bottom: 1px solid var(--color-base-300);
  }`;

  const page = View(
    {
      component,
      ...restProps,
      htmlHead: [
        ...(restProps.htmlHead ?? []),
        View({ tag: "meta", charset: "UTF-8" }),
        View({
          tag: "meta",
          "http-equiv": "X-UA-Compatible",
          content: "IE=edge",
        }),
        title,
        style,
        // View({ tag: "script", src: "//unpkg.com/alpinejs", defer: true }),
        View({ tag: "style" }, customCss),
      ],
    },
    [
      View(
        { p: "xs", class: "border-bottom header" },
        Container({ size: "xl", mx: "auto" }, [
          Button({ link: true, "u-on:click": "$routing.back()" }, "Back"),
          Button(
            {
              color: "dark",
              "u-on:click": `el => document.body.setAttribute('u-view-theme', document.body.getAttribute('u-view-theme') === 'dark' ? 'light' : 'dark')`,
            },
            "Dark"
          ),
        ])
      ),
      Container({ size: "xl", mx: "auto" }, [
        name && View({ tag: "h1", my: "md" }, name),
        View({}, slots),
      ]),
    ]
  );

  return page;
}
