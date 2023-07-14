import { Base } from "../utils.js";
import { View } from "./View.js";

/**
* 
*/
export const Divider = Base(($props, $slots) => {
  const {
    tag = "hr",
    component = "divider",
    color = "secondary",
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    tag,
    component,
    cssProps: {
      color,
    },
  };

  return View(props,$slots);
});
