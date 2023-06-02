import { tag } from "@ulibs/router";
import { View } from "../../components/index.js";

export default () =>
  View({}, [
    tag("a", { href: "/" }, "UBuilder"),
    tag("h1", {}, "Components"),
    tag("p", {}, "Documentation for Components package"),
    tag("ul", {}, [
      tag(
        "li",
        {},
        tag("a", { href: "/components/accordion-example" }, "Accordion Example")
      ),
      tag("li", {}, tag("a", { href: "/components/button" }, "Button")),
      tag("li", {}, tag("a", { href: "/components/card" }, "Card")),
      tag(
        "li",
        {},
        tag("a", { href: "/components/card-example" }, "Card Example")
      ),
      tag("li", {}, tag("a", { href: "/components/view" }, "View")),
    ]),
  ]);
