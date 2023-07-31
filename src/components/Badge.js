import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Badge = Base({
  render($props, $slots) {
    const { props, cssProps, restProps} = extract($props, {
      props: {
        tag: "span",
        component: "badge",
        color: "light",
        size: "md",
      },
      cssProps: {
        color: undefined,
        size: undefined,
      },
    });

    return View({ ...props, cssProps, ...restProps }, $slots);
  },
});
