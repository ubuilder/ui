import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Avatar}
 */
export const Avatar = Base(($props, $slots) => {
  $props.component = "avatar";

  const size = $props.size;
  delete $props["size"];

  const src = $props.src;
  delete $props["src"];

  const alt = $props.alt;
  delete $props["alt"];

  const initials = $props.initials;
  delete $props["initials"];

  const className = [
    "avatar",
    size && `avatar-${size}`,
    $props.class,
  ]
    .filter(Boolean)
    .join(" ");

  const content = src
    ? View({ component: "img", src, alt })
    : initials
    ? View({}, initials)
    : null;

  return View({ ...$props, class: className }, content);
});