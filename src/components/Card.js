import { Base } from "../utils.js";
import { View } from "./View.js";

/**
* @type {import('.').Card}
*/
export const Card = Base(($props, $slots) => {
  $props.component = "card";

  const title = $props.title;
  delete $props["title"];

  return View($props, [title && CardHeader([CardTitle(title)]), $slots]);
});

/**
* @type {import('.').CardBody}
*/
export const CardBody = Base(($props, $slots) => {
  $props.component = "card-body";

  return View($props, $slots);
});

/**
* @type {import('.').CardHeader}
*/
export const CardHeader = Base(($props, $slots) => {
  $props.component = "card-header";

  return View($props, $slots);
});

/**
* @type {import('.').CardTitle}
*/
export const CardTitle = Base(($props, $slots) => {
  $props.component = "card-title";

  return View($props, $slots);
});

/**
* @type {import('.').CardFooter}
*/
export const CardFooter = Base(($props, $slots) => {
  $props.component = "card-footer";

  return View($props, $slots);
});

/**
* @type {import('.').CardActions}
*/
export const CardActions = Base(($props, $slots) => {
  $props.component = "card-actions";

  return View($props, $slots);
});
