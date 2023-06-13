import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Image}
 */
export const Image = Base(($props, $slots) => {
  $props.component = "image";
  $props.tag = "img"

  const src = $props.src;

  const alt = $props.alt;

  return View({ ...$props, src, alt });
});