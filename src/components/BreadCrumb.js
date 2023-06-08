import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Breadcrumb}
 */
export const Breadcrumb = Base(($props, $slots) => {
  $props.component = "nav";
  $props["aria-label"] = "breadcrumb";

  return View($props, [$slots]);
});

/**
 * @type {import('./types').BreadcrumbItem}
 */
export const BreadcrumbItem = Base(($props, $slots) => {
  $props.component = "a";
  $props.href = $props.href || "#";

  return View($props, [$slots]);
});
