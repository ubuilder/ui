import { Form, Icon, Input } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Preview } from "../components/Preview.js";
import { Section } from "../components/Section.js";

export default () =>
  DocPage({ name: "Icon" }, [
    Section({ title: "Default" }, [Preview({ code: 'Icon("user")' })]),
    Section({ title: "Dynamic" }, [
      Preview({
        style: 'height: 300px',
        code: `Form([
        Input({ label: "Enter icon name...", name: "icon" }),
        Icon({ m: "md", size: "xl", name: "icon" }),
      ])`,
      }),
    ]),
  ]);
