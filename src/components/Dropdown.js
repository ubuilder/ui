import { Base } from "../utils.js";
import { View } from "./View.js";
import { Image } from "./Image.js";

/**
 * @type {import('./types').Dropdown}
 */
export const Dropdown = Base(($props, $slots) => {
  const {
    component = "Dropdown",
    size = "md",
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    component,
    cssProps: {
      size,
    },    
  }

  let content = View(props, $slots)
  return content;
});

