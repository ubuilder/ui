import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Card}
 */
export const Card = Base(($props, $slots) => {
  $props.component = "card";

  const title = $props.title;
  delete $props["title"];

  return View($props, [title && CardHeader([CardTitle(title)]), $slots]);
});

/**
 * @type {import('./types').CardBody}
 */
export const CardBody = Base(($props, $slots) => {
  $props.component = "card-body";

  return View($props, $slots);
});

/**
 * @type {import('./types').CardHeader}
 */
export const CardHeader = Base(($props, $slots) => {
  $props.component = "card-header";

  return View($props, $slots);
});

/**
 * @type {import('./types').CardTitle}
 */
export const CardTitle = Base(($props, $slots) => {
  $props.component = "card-title";

  return View($props, $slots);
});

/**
 * @type {import('./types').CardFooter}
 */
export const CardFooter = Base(($props, $slots) => {
  $props.component = "card-footer";

  return View($props, $slots);
});

/**
 * @type {import('./types').CardActions}
 */
export const CardActions = Base(($props, $slots) => {
  $props.component = "card-actions";

  return View($props, $slots);
});
