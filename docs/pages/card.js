import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({name: 'Card'}, [
    Section({title: 'Card', description: 'This is Card component'}),
    Section({title: 'Card.Header', description: 'This is CardHeader component'}),
    Section({title: 'Card.Body', description: 'This is CardBody component'}),
    Section({title: 'Card.Title', description: 'This is CardTitle component'}),
    Section({title: 'Card.Actions', description: 'This is CardActions component'}),
    Section({title: 'Card.Footer', description: 'This is CardFooter component'}),
  ]);
};
