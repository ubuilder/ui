import { View } from "./View.js";

/**
 * @type {import('./types').Button}
 */
export function Button($props, slots) {
  const {
    href,
    tag = href ? "a" : "button",
    component = "button",
    size = "sm",
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
      link,
    },
  };

  return View(props, slots);
}

/**
 * @type {import('./types').ButtonGroup}
 */
export function ButtonGroup($props, slots) {
  const { component = "button-group", compact = false, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    cssProps: {
      compact,
    },
  };

  return View({ ...props, component }, slots);
}
