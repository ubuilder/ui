import { Avatar } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Preview } from "../components/Preview.js";
import { Section } from "../components/Section.js";

export default function ({...props}) {
  return DocPage({ name: "Avatar" }, [
    Section({ title: "Default" }, [
      Preview({
        ...props,
        code: `
  Avatar('AV')
`,
      }),
    ]),
    Section({ title: "Image" }, [
      Preview({
        ...props,
        code: `
  Avatar({ src: 'https://avatars.githubusercontent.com/u/67925134?s=96&v=4' })
`,
      }),
    ]),

    Section({ title: "Colors" }, [
      Preview({
        ...props,
        code: `
  Avatar({color: "primary"}, "PR"),
  Avatar({color: "secondary" }, "SE"),
  Avatar({color: "success" }, "SU"),
  Avatar({color: "warning"}, "WA"),
  Avatar({color: "info" }, "IN"),
  Avatar({color: "error" }, "ER"),
  Avatar({color: "light" }, "LI"),
  Avatar({color: "dark" }, "DA"),
`,
      }),
    ]),

    Section({ title: "Sizes" }, [
      Preview({
        ...props,
        code: `
  Avatar({ color: "primary", size: "xs"}, "XS"),
  Avatar({ color: "primary", size: "sm"}, "SM"),
  Avatar({ color: "primary", size: "md"}, "MD"),
  Avatar({ color: "primary", size: "lg"}, "LG"),
  Avatar({ color: "primary", size: "xl"}, "XL"),
`,
      }),
    ]),
  ]);
}
