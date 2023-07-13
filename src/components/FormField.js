import { compile } from "sass";
import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('.').FormField}
 */
export const FormField = Base(($props, $slots) => {
  const { component = "form-field", name, label, ...restProps } = $props;

  const props = { tag: "div", component: component + "-wrapper", ...restProps };

  const labelProps = {
    component: component + "-label",
    tag: "label",
    for: name,
  };

  return View(props, [label && View(labelProps, label), $slots]);
});
