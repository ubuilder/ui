import { View } from "./View.js";

/**
 *
 * @type {import('./types').Badge}
 */
export function Badge({ component = "badge", color, size }, ...slots) {
  return View({ component, cssProps: { color, size } }, ...slots);
}
