import { AlertContainer } from "../../components/Alert.js";
import { Button } from "../../components/Button.js";
import { Col, Container, Row } from "../../components/GridSystem.js";
import { View } from "../../components/View.js";
import { Badge, Card, CardBody } from "../../components/index.js";

// done: true | false | '50'

const components = {
  accordion: { title: "Accordion", new: true, done: true },
  alert: { title: "Alert", done: true },
  autocomplete: { title: "Autocomplete", new: true, done: true },
  avatar: { title: "Avatar", done: true },
  badge: { title: "Badge", new: true, done: true },
  breadcrumb: { title: "Breadcrumb", done: false },
  button: { title: "Button", updated: true, done: true },
  card: { title: "Card", done: false },
  checkbox: { title: "Checkbox & Radio", done: false },
  codeeditor: { title: "Code Editor", soon: true, done: false },
  divider: { title: "Divider", done: false },
  dropdown: { title: "Dropdown", done: false },
  form: { title: "Form", soon: true, done: false },
  formfield: { title: "FormField", soon: true, done: false },
  grid: { title: "Grid", done: false },
  icon: { title: "Icon", new: true, done: true },
  image: { title: "Image", soon: true, done: false },
  input: { title: "Input", soon: true, done: false },
  modal: { title: "Modal", new: true, done: 50 },
  popover: { title: "Popover", updated: true, done: true },
  progress: { title: "Progress", done: true },
  radio: { title: "Radio", soon: true, done: false },
  select: { title: "Select", soon: true, done: false },
  spinner: { title: "Spinner", done: true },
  switch: { title: "Switch", updated: true, done: true },
  table: { title: "Table", updated: true, done: true },
  tabs: { title: "Tabs", updated: true, done: true },
  textarea: { title: "Textarea", new: true, done: true },
  tooltip: { title: "Tooltip", done: true },
  view: { title: "View", new: true, done: '50' },
};

export default ({ prefix }) => {
  function ComponentItems() {
    return Object.keys(components).map((key) =>
      Item({
        done: components[key].done,
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

  function Item({ done, disabled, slug, text, tags = [] }) {
    const doneProps = done === true
      ? { border: true, borderColor: "success-300" }
      : done == "50"
      ? { border: true, borderColor: "warning-300" }
      : { style: 'box-shadow: 0 2px 6px -1px var(--color-error-300); border: 1px solid var(--color-error-400)' };
    return Col({ col: 12, colSm: 6, colLg: 4 }, [
      Card(
        {
          ...doneProps,
          tag: disabled ? "span" : "a",
          d: "block",
          href: `${prefix}${slug}`,
          onClick: disabled
            ? `$alert.info('there is no documentation for ${text} component yet!<br/><br/>Please come back later!', 'Page is not available')`
            : undefined,
          style: (doneProps.style ?? '') + ";text-decoration: none; color: var(--color-base-900)",
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
          ]),
          Button(
            {
              d: "none",
              dXs: "inline-flex",
              mt: "sm",
              ms: "auto",
              color: "dark",
              "u-on:click": `el => document.body.setAttribute('u-view-theme', document.body.getAttribute('u-view-theme') === 'dark' ? 'light' : 'dark')`,
            },
            "Dark"
          ),
        ]),
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
      AlertContainer({ placement: "top-end" }),
    ]),
  ];
};
