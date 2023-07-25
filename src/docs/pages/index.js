import { Col, Container, Row } from "../../components/GridSystem.js";
import { View } from "../../components/View.js";
import { Card, CardBody } from "../../components/index.js";





export default ({ prefix }) => {
  function Item({ slug, text }) {
    return Col({ col: 12, colSm: 6, colLg: 4 }, [
      
      Card({ tag: 'a', d: 'block', href: `${prefix}${slug}`, style: 'text-decoration: none; color: var(--color-base-900)' }, [
        CardBody(text)
      ]),
    ]);
  }

  return Container({ size: "xl", mx: "auto", my: "xl" }, [
    // tag("a", { href: "/" }, "UBuilder"),
    View({ tag: "h1" }, "Components"),
    View({ tag: "h3", mb: "lg", mt: 'xxs', style: 'color: var(--color-base-800); font-weight: 400' }, "UI Components for NodeJS"),

    View({mb: 'md', mt: 'sm', style: 'line-height: var(--size-lg)'}, 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Eligendi at numquam est ad unde. Quibusdam blanditiis tempora unde! Eum quam ex totam autem obcaecati fuga quidem dignissimos laudantium et? Nihil, consequatur voluptates reiciendis pariatur tenetur architecto cumque doloremque quas incidunt facilis exercitationem esse deleniti totam dolores dicta commodi suscipit eius.'),

    Row([
      Item({ slug: 'installation', text: 'Installation'}),
      Item({ slug: 'basics', text: 'Basics'}),

      Col({w: 100}, View({tag: 'h3', pt: 'sm', style: 'font-weight: normal'}, 'Components')),
      Item({ slug: "autocomplete", text: "Autocomplete" }),
      Item({ slug: "avatar", text: "Avatar" }),      
      Item({ slug: "alert", text: "Alert" }),      
      Item({ slug: "breadcrumb", text: "Breadcrumb" }),
      Item({ slug: "button", text: "Button" }),
      Item({ slug: "card", text: "Card" }),
      Item({ slug: "checkbox", text: "Checkbox & Radio" }),
      Item({ slug: "divider", text: "Divider" }),
      Item({ slug: "dropdown", text: "Dropdown" }),
      Item({ slug: "form-field", text: "FormField" }),
      Item({ slug: "grid", text: "Grid" }),
      Item({ slug: "icon", text: "Icon" }),
      Item({ slug: "progress", text: "Progress" }),
      Item({ slug: "spinner", text: "Spinner" }),
      Item({ slug: "tabs", text: "Tabs" }),
      Item({ slug: "tooltip", text: "Tooltip" }),
      Item({ slug: "popover", text: "Popover" }),

      Item({ slug: "view", text: "View" }),

      Col({w: 100}, View({tag: 'h3', pt: 'sm', style: 'font-weight: normal'}, 'Examples')),
      Item({ slug: "accordion-example", text: "Accordion Example" }),
      Item({ slug: "card-example", text: "Card Example" }),
      Item({ slug: "dynamic-form", text: "Form" }),
      Item({ slug: "login", text: "Login" }),
      Item({ slug: "signup", text: "Signup" }),
      Item({ slug: "table", text: "Table & Modal" }),
    ]),
  ]);
};
