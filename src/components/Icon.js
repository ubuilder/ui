import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Icon = Base({
  render($props, slots) {
    const { props, restProps, cssProps } = extract($props, {
      props: {
        component: "icon",
        tag: "span",
        name: undefined,
      },
      cssProps: { size: "md", color: undefined },
    });

    return View({
      ...props,
      cssProps,
      ...restProps,
    });
  },
});
