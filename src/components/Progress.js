import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 *
 * @type {import('./types').Progress}
 */
export const Progress = Base(($props, $slots) => {
  const {
    tag = "div",
    component = "progress",
    color = "primary",
    size = "md",
    value = 0,
    indeterminate = false,
    label,
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    tag,
    label,
    component,
    cssProps: {
      color,
      size
    },
  };

  return View(props, $slots);
});