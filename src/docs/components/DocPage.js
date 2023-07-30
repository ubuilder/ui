import { Col, Container } from "../../components/GridSystem.js";
import { Button, Icon, Row, View } from "../../components/index.js";
import { tag } from "../../core/tags.js";

export function DocPage(
  {
    component = "page",
    theme = "dark",
    name = "",
    host,
    prefix = "/ui/",
    ...restProps
  },
  slots
) {
  const style = View({
    tag: "link",
    rel: "stylesheet",
    href: prefix + "styles.css",
  });
  const title = View({ tag: "title" }, name + " | uLibs Component");

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
        `<script>
        function setTheme(theme) {
          localStorage.setItem('theme', theme)
          document.documentElement.setAttribute('u-view-theme', theme)
        } 
        
        setTheme((localStorage.getItem('theme') ?? 'light'))
        </script>`,

        ...(restProps.htmlHead ?? []),
        View({ tag: "meta", charset: "UTF-8" }),
        View({
          tag: "meta",
          "http-equiv": "X-UA-Compatible",
          content: "IE=edge",
        }),
        title,
        style,
        `<style>[u-view-theme="dark"] .hide-dark {display: none} .hide-light {display: none} [u-view-theme="dark"] .hide-light {display: block}</style>`,
        // View({ tag: "script", src: "//unpkg.com/alpinejs", defer: true }),
        View({ tag: "style" }, customCss),
      ],
    },
    [
      View(
        { py: "xs", class: "border-bottom header" },
        Container({ size: "xl", mx: "auto" }, [
          Row([
            Col([
              Button(
                { link: true, p: 0, href: "/ui" },
                View({ tag: "h3" }, "Home")
              ),
            ]),
            // Col([Button({ link: true, p: 0, onClick: "$routing.back()" }, Icon({name: 'chevron-left'}))]),
            Col({ ms: "auto", d: 'flex' }, [
              Button(
                {
                  me: "xxs",
                  color: "dark",
                  href: "https://github.com/ubuilder/ui",
                },
                [Icon({ name: "brand-github" })]
              ),
              View({d: 'flex'}, [
                Button(
                  {
                    class: "hide-dark",
                    ms: "auto",
                    "u-on:click": `setTheme('dark')`,
                  },
                  Icon({ name: "moon" })
                ),
                Button(
                  {
                    class: "hide-light",
                    ms: "auto",
                    "u-on:click": `setTheme('light')`,
                  },
                  Icon({ name: "sun" })
                ),
              ]),
            ]),
          ]),
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
