import {
  Avatar,
  View
} from "../../components/index.js";

import { DocPage } from "../components/DocPage.js";

const avatar = ({ title, description }) => {
    return View({style: "display: flex; gap: 4px"},[
        Avatar({color: "error", size: "xs"}, "EA"),
        Avatar({color: "success", size: "sm"}, "EA"),
        Avatar({color: "warning"}, "EA"),
        Avatar({color: "secondary", size: "lg"}, "EA"),
        Avatar({color: "primary", size: "xl",src:"https://avatars.githubusercontent.com/u/67925134?s=96&v=4"}),
    ])
};

export default function () {
  return DocPage({ name: "avatar" }, [avatar("simple-avatar", "desc....")]);
}
