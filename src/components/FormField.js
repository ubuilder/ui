import { compile } from "sass";
import { Base } from "../utils.js";
import { View } from "./View.js";
import { Col } from "./GridSystem.js";

/**
 * 
 */
export const FormField = Base(($props, $slots) => {
  const { component = "form-field", name, label, col=12, ...restProps } = $props;

  const props = { tag: "div", 'u-form-field': true, col, ...restProps };

  const labelProps = {
    component: "form-field-label",
    tag: "label",
    for: name,
  };

  return Col(props, [label && View(labelProps, label), $slots]);
});
