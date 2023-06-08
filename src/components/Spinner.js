import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Spinner}
 */
export const Spinner = Base(($props, $slots) => {
  $props.component = "spinner";

  const size = $props.size;
  delete $props["size"];

  const color = $props.color;
  delete $props["color"];

  const className = [
    "spinner",
    size && `spinner-${size}`,
    color && `spinner-${color}`,
    $props.class,
  ]
    .filter(Boolean)
    .join(" ");

  return View({ ...$props, class: className });
});