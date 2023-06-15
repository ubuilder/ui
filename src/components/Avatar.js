import { Base } from "../utils.js";
import { View } from "./View.js";
import { Image } from "./Image.js";

/**
 * @type {import('./types').Avatar}
 */
export const Avatar = Base(($props, $slots) => {
  const {
    tag = "span",
    component = "avatar",
    size = "md",
    color = "light",
    src = undefined,
    alt = undefined,
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
  }

  const content = src
    ? View(props, Image({src, alt, component: component+"-image"}))
    : View(props, $slots)
    
  return content;
});