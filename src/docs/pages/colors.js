import { Row, Col, For, View, } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

let colorNames = [
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "error",
  'light',
  'dark'
];
let colorValues = [100, 200, 300, 400, 500, 600, 700, "content"];

export default () => {
  return DocPage({ name: "Color System" }, [
    Section({ title: "colors" }, [
      colorNames.map((name) =>
        Row({mb: 'xxs'}, [
          Col({ col: 3, py: "xs", px: "md", bgColor: name, textColor: 'light' }, name),
          colorValues.map((value) => Col({ col: 1, py: "xs", px: "md", bgColor: `${name}-${value}`, textColor: 'dark-100' }, value)),
        ])
      ),
    ]),
  ]);
};
