import { View } from "./View.js";

/**
 *
 * @type {import('./types').Badge}
 */
export function Badge(
  { tag = "span", component = "badge", color, size, ...restProps },
  ...slots
) {
  return View(
    {
      ...restProps,
      tag,
      component,
      cssProps: { color, size },
    },
    ...slots
  );
}
