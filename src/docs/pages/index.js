import { Col, Container, Row } from "../../components/GridSystem.js";
import { View } from "../../components/View.js";
import { Badge, Card, CardBody } from "../../components/index.js";

const components = {
  accordion: { title: "Accordion", new: true },
  alert: { title: "Alert" },
  autocomplete: { title: "Autocomplete" },
  avatar: { title: "Avatar" },
  badge: { title: 'Badge',new: true },
  breadcrumb: { title: "Breadcrumb" },
  button: { title: "Button" },
  card: { title: "Card" },
  checkbox: { title: "Checkbox & Radio" },
  codeeditor: {title: 'Code Editor', new: true},
  divider: { title: "Divider" },
  dropdown: { title: "Dropdown" },
  form: {title: "Form", new: true },
  formfield: { title: "FormField" , new: true },
  grid: { title: "Grid" },
  icon: { title: "Icon" },
  image: {title: 'Image', new: true },
  input: {title: 'Input', new: true },
  modal: {title: 'Modal'},
  popover: { title: "Popover" },
  progress: { title: "Progress" },
  radio: {title: "Radio", new: true },
  select: {title: 'Select', new: true },
  spinner: { title: "Spinner" },
  switch: {title: 'Switch'},
  table: {title: 'Table'},
  tabs: { title: "Tabs" },
  textarea: {title: 'Textarea', new: true },
  tooltip: { title: "Tooltip" },
  view: { title: "View" },
};

export default ({ prefix }) => {
  function ComponentItems() {
    return Object.keys(components).map((key) =>
      Item({ slug: key, text: components[key].title, tags: components[key].new ? ['New'] : [] })
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

  function Item({ slug, text, tags = [] }) {
    return Col({ col: 12, colSm: 6, colLg: 4 }, [
      Card(
        {
          tag: "a",
          d: "block",
          href: `${prefix}${slug}`,
          style: "text-decoration: none; color: var(--color-base-900)",
        },
        [CardBody([View({d: 'flex', align: 'center', gap: 'xs'}, [text, tags.map(tag => Badge({color: 'success'}, tag))])])]
      ),
    ]);
  }

  return Container({ size: "xl", mx: "auto", my: "xl" }, [
    // tag("a", { href: "/" }, "UBuilder"),
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
  ]);
};
