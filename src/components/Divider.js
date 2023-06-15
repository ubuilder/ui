import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 *
 * @type {import('./types').Divider}
 */
export const Divider = Base(($props, $slots) => {
  const {
    tag = "hr",
    component = "divider",
    text = "",
    placement = "center",
    direction = "horizontal",
    color,
    size,
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    tag,
    component,
    cssProps: {
      color,
      size
    },
  };

  const divider = View(props, $slots);

  if (text) {
    const textProps = {
      tag: "span",
      component: "divider-text",
      cssProps: {
        color,
        size,
      },
    };

    return View(textProps, text);
  }

  return divider;
});