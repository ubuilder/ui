import { View } from "./View.js";

/**
 *
 * @type {import('./types').Badge}
 */
export function Badge($props, ...slots) {
  const {
    tag = "span",
    component = "badge",
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
      size,
    },
  };

  return View(props, ...slots);
}
