import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Breadcrumb}
 */
export const Breadcrumb = Base(($props, $slots) => {
  $props.component = "breadcrumb";
  $props["aria-label"] = "breadcrumb";

  return View({...$props, tag: 'nav'}, $slots);
});

/**
 * @type {import('./types').BreadcrumbItem}
 */
export const BreadcrumbItem = Base(($props, $slots) => {
  $props.component = "breadcrumb-item";
  $props.href = $props.href || "#";  
  if ($props.active) {
    $props.active = "";
    $props.component +="-active"
  }
  
  if ($props.disabled) {
    $props.disabled = "true";
    $props.href = "#";
    $props.component +="-disabled"
  }

  return View({...$props, tag: 'a'}, $slots);
});
