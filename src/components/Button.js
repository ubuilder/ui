import { Base } from "../utils.js";
import { View } from "./View.js";

export const Button = Base({
  render($props, $slots) {
    const {
      href,
      tag = href ? "a" : "button",
      component = "button",
      disabled = false,
      $disabled,
      $color,
      $link,
      $size,
      size = "md",
      link = false,
      color = link ? "light" : undefined,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      disabled,
      $disabled,
      "$u-button-color": $color,
      "$u-button-size": $size,
      "$u-button-link": $link,
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
