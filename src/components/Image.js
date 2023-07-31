import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Image = Base({
  render($props, $slots) {
    const { props, restProps, cssProps } = extract($props, {
      props: {
        component: $props.component ?? "image",
        tag: "img",
      },
    });

    return View({ ...props, cssProps, ...restProps });
  },
});
