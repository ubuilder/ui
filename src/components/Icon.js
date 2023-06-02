import { View } from "./View.js";

/**
 * @type {import('./types').Icon}
 */
export function Icon({ name, size }) {
  return View({
    tag: "span",
    onMount,
    component: "icon",
    jsProps: name,
  });
}
