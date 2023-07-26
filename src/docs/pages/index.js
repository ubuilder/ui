import { AlertContainer } from "../../components/Alert.js";
import { Button } from "../../components/Button.js";
import { Col, Container, Row } from "../../components/GridSystem.js";
import { View } from "../../components/View.js";
import { Badge, Card, CardBody } from "../../components/index.js";

const components = {
  accordion: { title: "Accordion", new: true },
  alert: { title: "Alert" },
  autocomplete: { title: "Autocomplete", new: true },
  avatar: { title: "Avatar" },
  badge: { title: "Badge", new: true },
  breadcrumb: { title: "Breadcrumb" },
  button: { title: "Button", updated: true },
  card: { title: "Card" },
  checkbox: { title: "Checkbox & Radio" },
  codeeditor: { title: "Code Editor", soon: true },
  divider: { title: "Divider" },
  dropdown: { title: "Dropdown" },
  form: { title: "Form", soon: true },
  formfield: { title: "FormField", soon: true },
  grid: { title: "Grid" },
  icon: { title: "Icon", new: true },
  image: { title: "Image", soon: true },
  input: { title: "Input", soon: true },
  modal: { title: "Modal", new: true },
  popover: { title: "Popover", updated: true },
  progress: { title: "Progress" },
  radio: { title: "Radio", soon: true },
  select: { title: "Select", soon: true },
  spinner: { title: "Spinner" },
  switch: { title: "Switch" },
  table: { title: "Table" },
  tabs: { title: "Tabs", updated: true },
  textarea: { title: "Textarea", soon: true },
  tooltip: { title: "Tooltip" },
  view: { title: "View", new: true },
};

export default ({ prefix }) => {
  function ComponentItems() {
    return Object.keys(components).map((key) =>
      Item({
        disabled: components[key].soon,
        slug: key,
        text: components[key].title,
        tags: [
          components[key].new && { text: "New", color: "primary" },
          components[key].soon && { text: "Comming Soon", color: "warning" },
          components[key].updated && { text: "Updated", color: "info" },
        ].filter(Boolean),
      })
    );
  }

  function ExampleItems() {
    return [
      Item({ slug: "accordion-example", text: "Accordion Example" }),
      Item({ slug: "card-example", text: "Card Example" }),
      Item({ slug: "dynamic-form", text: "Form" }),
      Item({ slug: "login", text: "Login" }),
      Item({ slug: "signup", text: "Signup" }),
      Item({ slug: "table", text: "Table & Modal" }),
    ];
  }

  function Heading({ title }) {
    return Col(
      { w: 100 },
      View({ tag: "h3", pt: "sm", style: "font-weight: normal" }, title)
    );
  }

  function Item({ disabled, slug, text, tags = [] }) {
    return Col({ col: 12, colSm: 6, colLg: 4 }, [
      Card(
        {
          tag: disabled ? 'span' : "a",
          d: "block",
          href: `${prefix}${slug}`,
          onClick: disabled ? `$alert.info('there is no documentation for ${text} component yet!<br/><br/>Please come back later!', 'Page is not available')` : undefined,
          style: "text-decoration: none; color: var(--color-base-900)",
        },
        [
          CardBody([
            View({ d: "flex", align: "center", gap: "xs" }, [
              text,
              tags.map((tag) => Badge({ color: tag.color }, tag.text)),
            ]),
          ]),
        ]
      ),
    ]);
  }

  return [
    View(
      { p: "xs", class: "border-bottom header" },
      Container({ size: "xl", mx: "auto" }, [
        Row([
          Col([
          View({ tag: "h1" }, "Components"),
          View(
            {
              tag: "h3",
              mb: "lg",
              mt: "xxs",
              style: "color: var(--color-base-800); font-weight: 400",
            },
            "UI Components for NodeJS"
          ),
          ]) ,     
        Button(
          {
            d: 'none',
            dXs: 'inline-flex',
            mt: 'sm',
            ms: 'auto',
            color: "dark",
            "u-on:click": `el => document.body.setAttribute('u-view-theme', document.body.getAttribute('u-view-theme') === 'dark' ? 'light' : 'dark')`,
          },
          "Dark"
        ),
      ])

      ])
    ),
    Container({ size: "xl", mx: "auto", my: "xl" }, [
    // tag("a", { href: "/" }, "UBuilder"),
  
    View(
      { mb: "md", mt: "sm", style: "line-height: var(--size-lg)" },
      "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Eligendi at numquam est ad unde. Quibusdam blanditiis tempora unde! Eum quam ex totam autem obcaecati fuga quidem dignissimos laudantium et? Nihil, consequatur voluptates reiciendis pariatur tenetur architecto cumque doloremque quas incidunt facilis exercitationem esse deleniti totam dolores dicta commodi suscipit eius."
    ),

    Row([
      Item({ slug: "installation", text: "Installation" }),
      Item({ slug: "basics", text: "Basics" }),
      Item({ slug: "colors", text: "Colors" }),

      Heading({ title: "Components" }),

      ComponentItems(),

      Heading({ title: "Examples" }),
      ExampleItems(),
    ]),
    AlertContainer({placement: 'top-end'})
  ])];
};
