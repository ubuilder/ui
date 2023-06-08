import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Image}
 */
export const Image = Base(($props, $slots) => {
  $props.component = "image";

  const src = $props.src;
  delete $props["src"];

  const alt = $props.alt;
  delete $props["alt"];

  const className = ["image", $props.class].filter(Boolean).join(" ");

  return View({ ...$props, class: className, src, alt });
});