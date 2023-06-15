import { Spinner, View } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";

const divider = ({ title, description }) => {
  return View({style:"display: flex; gap: 6px"},[
    Spinner({size: "xs", color: "primary"}),
    Spinner({size: "sm", color: "secondary"}),
    Spinner({size: "md", color: "error"}),
    Spinner({size: "lg", color: "warning"}),
    Spinner({size: "xl", color: "success"}),
  ]) 
};

export default () => {
  return DocPage(
    { name: "spinner" },
    divider({
      title: "simple spinner",
      description: "spinner with different colors and sizes",
    })
  );
};
