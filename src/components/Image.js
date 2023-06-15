import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Image}
 */
export const Image = Base(($props, $slots) => {
  $props.component = $props.component ?? "image";
  $props.tag = "img"

  return View($props);
});