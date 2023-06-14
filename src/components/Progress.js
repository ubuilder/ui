import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Progress}
 */
export const Progress = Base(($props, $slots) => {
  $props.component = "div";

  const value = $props.value;
  delete $props["value"];

  const max = $props.max;
  delete $props["max"];

  const striped = $props.striped;
  delete $props["striped"];

  const animated = $props.animated;
  delete $props["animated"];

  const color = $props.color;
  delete $props["color"];

  const className = [
    "progress",
    striped && "progress-striped",
    animated && "progress-animated",
    color && `bg-${color}`,
    $props.class,
  ]
    .filter(Boolean)
    .join(" ");

  const style = {
    width: `${(value / max) * 100}%`,
  };

  return View({ ...$props, class: className }, [
    View({ class: "progress-bar", role: "progressbar", style, "aria-valuenow": value, "aria-valuemin": 0, "aria-valuemax": max }),
  ]);
});
