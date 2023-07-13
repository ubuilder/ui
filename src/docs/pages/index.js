import { tag } from "../../core/index.js";
import { View } from "../../components/index.js";

export default ({prefix}) =>
  View({}, [
    tag("a", { href: "/" }, "UBuilder"),
    tag("h1", {}, "Components"),
    tag("p", {}, "Documentation for Components package"),
    tag("ul", {}, [
      tag(
        "li",
        {},
        tag("a", { href: `${prefix}accordion-example` }, "Accordion Example")
      ),
      tag("li", {}, tag("a", { href: `${prefix}button` }, "Button")),
      tag("li", {}, tag("a", { href: `${prefix}card` }, "Card")),
      tag(
        "li",
        {},
        tag("a", { href: `${prefix}card-example` }, "Card Example")
      ),
      tag("li", {}, tag("a", { href: `${prefix}table` }, "Table & Modal")),
      tag("li", {}, tag("a", { href: `${prefix}view` }, "View")),
      tag("li", {}, tag("a", { href: `${prefix}divider` }, "Divider")),
      tag("li", {}, tag("a", { href: `${prefix}spinner` }, "Spinner")),
      tag("li", {}, tag("a", { href: `${prefix}breadcrumb` }, "Breadcrumb")),
      tag("li", {}, tag("a", { href: `${prefix}form` }, "Form")),
      tag("li", {}, tag("a", { href: `${prefix}checkbox` }, "Checkbox & Radio")),
      tag("li", {}, tag("a", { href: `${prefix}grid` }, "Grid")),


      tag("li", {}, tag("a", { href: `${prefix}avatar` }, "Avatar")),
      tag("li", {}, tag("a", { href: `${prefix}progress` }, "Progress")),
      tag("li", {}, tag("a", { href: `${prefix}tab` }, "Tab")),
      tag("li", {}, tag("a", { href: `${prefix}dropdown` }, "Dropdown")),
      tag("li", {}, tag("a", { href: `${prefix}auto-complete` }, "Auto Complete")),
      tag("li", {}, tag("a", { href: `${prefix}login` }, "Login")),
      tag("li", {}, tag("a", { href: `${prefix}signup` }, "Signup")),
    ]),
  ]);
