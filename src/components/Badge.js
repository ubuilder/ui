import { Base } from "../utils.js";
import { View } from "./View.js";

export const Badge = Base({
  render($props, $slots) {
    const {
      tag = "span",
      component = "badge",
      color,
      size,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      tag,
      component,
      cssProps: {
        color,
        size,
      },
    };

    return View(props, $slots);
  },
});
