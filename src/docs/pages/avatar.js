import { Avatar } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Preview } from "../components/Preview.js";
import { Section } from "../components/Section.js";


export default function () {
  return DocPage({name: 'Avatar'}, [
    Section({title: 'Default'}, [
      Preview({d: 'flex', align: 'end', gap: 'xs', code: `[
  Avatar({color: "error", size: "xs"}, "EA"),
  Avatar({color: "success", size: "sm"}, "EA"),
  Avatar({color: "warning"}, "EA"),
  Avatar({color: "secondary", size: "lg"}, "EA"),
  Avatar({color: "primary", size: "xl", src:"https://avatars.githubusercontent.com/u/67925134?s=96&v=4"})
]`}, [
        Avatar({color: "error", size: "xs"}, "EA"),
        Avatar({color: "success", size: "sm"}, "EA"),
        Avatar({color: "warning"}, "EA"),
        Avatar({color: "secondary", size: "lg"}, "EA"),
        Avatar({color: "primary", size: "xl", src:"https://avatars.githubusercontent.com/u/67925134?s=96&v=4"}),
      ])
    ])
  ])
}
