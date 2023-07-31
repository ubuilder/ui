import { AlertContainer } from "../../components/Alert.js";
import { Button } from "../../components/Button.js";
import { Col, Container, Row } from "../../components/GridSystem.js";
import { View } from "../../components/View.js";
import { Badge, Card, CardBody } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";

const components = {
  accordion: { title: "Accordion" },
  alert: { title: "Alert" },
  autocomplete: { title: "Autocomplete" },
  avatar: { title: "Avatar" },
  badge: { title: "Badge" },
  breadcrumb: { title: "Breadcrumb" },
  button: { title: "Button" },
  card: { title: "Card", danger: true },
  checkbox: { title: "Checkbox & Radio", danger: true },
  colorpicker: { title: "Colorpicker", soon: true },
  codeeditor: { title: "Code Editor", soon: true },
  divider: { title: "Divider" },
  dropdown: { title: "Dropdown", danger: true },
  datepicker: { title: "Datepicker", soon: true },
  fieldset: { title: "Fieldset" },
  "file-upload": { title: "FileUpload & Dropzone", soon: true },
  form: { title: "Form" },
  formfield: { title: "FormField" },
  grid: { title: "Grid" },
  header: { title: "Header", soon: true },
  icon: { title: "Icon" },
  image: { title: "Image" },
  input: { title: "Input", danger: true },
  modal: { title: "Modal" },
  offcanvas: { title: "Offcanvas", soon: true },
  popover: { title: "Popover" },
  progress: { title: "Progress" },
  radio: { title: "Radio", danger: true },
  select: { title: "Select", danger: true },
  sidebar: { title: "Sidebar", soon: true },
  spinner: { title: "Spinner" },
  switch: { title: "Switch" },
  table: { title: "Table" },
  tabs: { title: "Tabs" },
  texteditor: { title: "TextEditor" },
  textarea: { title: "Textarea" },
  tooltip: { title: "Tooltip" },
  view: { title: "View" },
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
          components[key].danger && { text: "Documentation Not completed", color: "error" },
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
          tag: disabled ? "span" : "a",
          d: "block",
          href: `${prefix}${slug}`,
          onClick: disabled
            ? `$alert.info('there is no documentation for ${text} component yet!<br/><br/>Please come back later!', 'Page is not available')`
            : undefined,
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
    DocPage(
      { name: "Components"},
      View(
        {
          tag: "h3",
          mb: "lg",
          mt: "xxs",
          style: "color: var(--color-base-800); font-weight: 400",
        },
        "UI Components for NodeJS"
      ),
      
    ),
    Container({ size: "xl", mx: "auto", my: "xl" }, [
      // tag("a", { href: "/" }, "UBuilder"),

      View(
        { mb: "md", mt: "sm", style: "line-height: var(--size-lg)" },
        "Welcome to @ulibs/ui documentation, uLibs UI is a set of components which you can use in your javascript based projects, each component is a function which returns Clean HTML code powered by the simplicity and efficiency of Alpine.js."
      ),
      View(
        { mb: "md", mt: "sm", style: "line-height: var(--size-lg)" },
        "uLibs Components follows a straightforward and intuitive design system, with minimal and consistent designs."
      ),
      View(
        { mb: "md", mt: "sm", style: "line-height: var(--size-lg)" },
        "All Components extends from a powerful base component (View) which supports features like utility props, two way binding and more..."
      ),

      Row([
        Item({ slug: "installation", text: "Installation" }),
        Item({slug: 'view', text: 'View Component Features'}),
        Item({ slug: "basics", text: "Basics" }),
        Item({ slug: "colors", text: "Colors" }),

        Heading({ title: "Components" }),

        ComponentItems(),

        // Heading({ title: "Examples" }),
        // ExampleItems(),
      ]),
      AlertContainer({ placement: "top-end" }),
    ]),
  ];
};
