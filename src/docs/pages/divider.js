import { Divider, View } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";

const divider = ({ title, description }) => {
  return Divider({}, "something");
};

export default () => {
  return DocPage(
    { name: "divider" },
    divider({
      title: "simple divider",
      description: "description",
    })
  );
};
