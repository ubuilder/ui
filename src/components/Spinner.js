import { Base } from "../utils.js";
import { View } from "./View.js";

export const Spinner = Base({
  render($props, $slots) {
    const {
      tag = "div",
      component = "spinner",
      size = "md",
      color = "light",
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
