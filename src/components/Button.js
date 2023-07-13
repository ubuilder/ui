import { Base } from "../utils.js";
import { View } from "./View.js";

/**
* @type {import('.').Button}
*/
export const Button = Base(($props, $slots) => {
  const {
    href,
    tag = href ? "a" : "button",
    component = "button",
    size = "md",
    link = false,
    color = link ? "light" : undefined,
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    tag,
    component,
    href,
    cssProps: {
      color,
      size,
      link,
    },
  };

  return View(props, $slots);
});

/**
* @type {import('.').ButtonGroup}
*/
export const ButtonGroup = Base(($props, $slots) => {
  const { component = "button-group", compact = false, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    cssProps: {
      compact,
    },
  };

  return View(props, $slots);
});
