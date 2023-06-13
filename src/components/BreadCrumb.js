import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Breadcrumb}
 */
export const Breadcrumb = Base(($props, $slots) => {
  $props.component = "breadcrumb";
  $props["aria-label"] = "breadcrumb";

  return View({...$props, tag: 'ol'}, $slots);
});


/**
 * @type {import('./types').Breadcrumb}
 */
export const BreadcrumbItemWrapper = Base(($props, $slots) => {
  $props.component = "breadcrumb-item-wrapper";

  return View({...$props, tag: 'li'}, $slots);
});

/**
 * @type {import('./types').BreadcrumbItem}
 */
export const BreadcrumbItem = Base(($props, $slots) => {
  $props.component = "breadcrumb-item";
  const {
    active = false,
    disabled = false,
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    tag: 'a',
    cssProps: {
      active,
      disabled
    },
  }

  $props.href = $props.href || "#";  
  
  if ($props.disabled) {
    $props.href = "#";
  }

  return View(props, $slots);
});
