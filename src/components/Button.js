import { Base } from "../utils.js";
import { View } from "./View.js";

export const Button = Base({
  render($props, $slots) {
    const {
      href,
      tag = href ? "a" : "button",
      component = "button",
      size = "md",
      link = false,
      color = link ? "light" : undefined,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      tag,
      component,
      href,
      cssProps: {
        color,
        size,
        link,
      },
    };

    return View(props, $slots);
  },
});

export const ButtonGroup = Base({
  render($props, $slots) {
    const {
      component = "button-group",
      compact = false,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
      cssProps: {
        compact,
      },
    };

    return View(props, $slots);
  },
});
