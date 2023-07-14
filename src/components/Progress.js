import { Base } from "../utils.js";
import { View } from "./View.js";

export const Progress = Base({
  render($props, $slots) {
    const {
      component = "progress",
      value = 0,
      color = "primary",
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
    };

    const progressProps = {
      component: component + "-bar",
      cssProps: {
        color,
      },
    };

    return View(
      props,
      View({ ...progressProps, style: "width:" + `${value}%` })
    );
  },
});
