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
 * @type {import('./types').BreadcrumbItem}
 */
export const BreadcrumbItem = Base(($props, $slots) => {
  
  const {
    active = false,
    disabled = false,
    component = "breadcrumb-item",
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    tag: 'a',
    component,
    cssProps: {
      active,
      disabled
    },
  }

  return View({component: component+"-wrapper", tag:"li"}, View(props, $slots));
});
