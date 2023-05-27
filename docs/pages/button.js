import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({name: 'Button'}, [
    Section({title: 'Button', description: 'This is Button component'}),
    Section({title: 'Button.Group', description: 'This is ButtonGroup component'}),
  ]);
};
