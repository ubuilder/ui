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
      tag("li", {}, tag("a", { href: "/components/table" }, "Table & Modal")),
      tag("li", {}, tag("a", { href: "/components/view" }, "View")),
      tag("li", {}, tag("a", { href: "/components/divider" }, "Divider")),
      tag("li", {}, tag("a", { href: "/components/spinner" }, "Spinner")),
      tag("li", {}, tag("a", { href: "/components/breadcrumb" }, "Breadcrumb")),
      tag("li", {}, tag("a", { href: "/components/form" }, "Form")),
      tag("li", {}, tag("a", { href: "/components/checkbox" }, "Checkbox & Radio")),
      tag("li", {}, tag("a", { href: "/components/grid" }, "Grid")),


      tag("li", {}, tag("a", { href: "/components/avatar" }, "Avatar")),
      tag("li", {}, tag("a", { href: "/components/progress" }, "Progress")),
      tag("li", {}, tag("a", { href: "/components/tab" }, "Tab")),
      tag("li", {}, tag("a", { href: "/components/dropdown" }, "Dropdown")),
      tag("li", {}, tag("a", { href: "/components/login" }, "Login")),
      tag("li", {}, tag("a", { href: "/components/signup" }, "Signup")),
    ]),
  ]);
