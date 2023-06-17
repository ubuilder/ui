import {
  Divider,
  View
} from "../../components/index.js";

import { DocPage } from "../components/DocPage.js";

const divider = ({ title, description }) => {
  return View({},[
    View("something goes here"),
    Divider({color: "error"}),
    View("something goes here"),
    Divider({color: "success"}),
    ])
};

export default function () {
  return DocPage({ name: "divider" }, [divider("simple-divider", "desc....")]);
}
