import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Divider}
 */
export const Divider = Base(($props, $slots) => {
  $props.component = "divider";

  const text = $props.text;
  delete $props["text"];

  const withoutText = $props.withoutText;
  delete $props["withoutText"];

  const placement = $props.placement;
  delete $props["placement"];

  const direction = $props.direction;
  delete $props["direction"];

  const className = [
    "divider",
    text && `divider-text divider-${placement}`,
    withoutText && "divider-without-text",
    direction && `divider-${direction}`,
    $props.class,
  ]
    .filter(Boolean)
    .join(" ");

  return View({ ...$props, class: className }, text ? text : null);
});