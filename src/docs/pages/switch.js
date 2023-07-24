import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Preview } from "../components/Preview.js";
import { Form, Switch, View } from "../../components/index.js";

export default () =>
  DocPage({ title: "Switch" }, [
    Section({ title: "Default" }, [
      Form([Switch({ name: "test", label: 'Switch' }), View({ tag: "span", "u-text": "test" })]),
    ]),
  ]);
