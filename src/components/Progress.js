import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Progress = Base({
  render($props, $slots) {
    const { component, restProps, cssProps, progressProps } = extract($props, {
      component: "progress",
      progressProps: {
        component: "progress-bar",
        value: 0,
        color: "light",
      },
      cssProps: {
        color: undefined,
      },
    });
    
    return View(
      { component, ...restProps },
      View({ ...progressProps, cssProps, style: "width:" + `${progressProps.value}%` })
    );
  },
});
