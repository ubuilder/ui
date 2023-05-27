import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({name: 'View'}, [
    Section({title: 'View', description: 'This is View component'}),
  ]);
};
