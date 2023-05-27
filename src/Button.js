import { View } from "./View.js";

/**
 * @type {import('./types').Button}
 */
export function Button(
  {
    tag = "button",
    component = "button",
    color = "primary",
    size = "sm",
    link = false,
    ...props
  },
  ...slots
) {
  if (link && !color) color = "dark";
  return View(
    { ...props, tag, component, cssProps: { color, link } },
    ...slots
  );
}

Button.Group = function (
  { tag, component = "button-group", compact = false, ...props },
  ...slots
) {
  return View({ ...props, tag, component }, ...slots);
};
