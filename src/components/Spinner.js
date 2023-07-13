import { Base } from "../utils.js";
import { View } from "./View.js";

/**
* @type {import('.').Spinner}
*/
export const Spinner = Base(($props, $slots) => {
  const {
    tag = "div",
    component = "spinner",
    size = "md",
    color = "light",
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    tag,
    component,
    cssProps: {
      color,
      size,
    },
  };

  return View(props, $slots);
});