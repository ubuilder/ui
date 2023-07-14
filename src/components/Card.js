import { Base } from "../utils.js";
import { View } from "./View.js";

/**
* 
*/
export const Card = Base(($props, $slots) => {
  $props.component = "card";

  const title = $props.title;
  delete $props["title"];

  return View($props, [title && CardHeader([CardTitle(title)]), $slots]);
});

/**
* 
*/
export const CardBody = Base(($props, $slots) => {
  $props.component = "card-body";

  return View($props, $slots);
});

/**
* 
*/
export const CardHeader = Base(($props, $slots) => {
  $props.component = "card-header";

  return View($props, $slots);
});

/**
* 
*/
export const CardTitle = Base(($props, $slots) => {
  $props.component = "card-title";

  return View($props, $slots);
});

/**
* 
*/
export const CardFooter = Base(($props, $slots) => {
  $props.component = "card-footer";

  return View($props, $slots);
});

/**
* 
*/
export const CardActions = Base(($props, $slots) => {
  $props.component = "card-actions";

  return View($props, $slots);
});
