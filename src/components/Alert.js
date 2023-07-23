import { Icon } from "./Icon.js";
import { Base, classname } from "../utils.js";
import { View } from "./View.js";

export const Alert = Base({
  render($props, $slots) {
    const {
      component = "alert",
      autoClose = false,
      duration = 5000,
      open = true,
      icon,
      color = "primary",
      dismissible = false,
      title,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
      duration: autoClose ? duration : undefined,
      cssProps: {
        color,
        autoClose,
        open,
      },
    };

    return View(props, [
      View({ component: component + "-header" }, [
        (icon &&
          Icon({ [classname(component + "-icon")]: true, color }, icon)) ||
          [],
        View({ component: component + "-title" }, title ?? ''),
        (dismissible &&
          View(
            { tag: "button", component: component + "-close" },
            Icon("x")
          )) ||
          [],
      ]),
      ($slots.toString() !== "" &&
        View({ component: component + "-content" }, $slots)) ||
        [],
    ]);
  },
});

export const AlertContainer = Base({
  render($props, $slots) {
    const {
      component = "alert-container",
      placement,
      name,
      ...restProps
    } = $props;

    const props = { 
        ...restProps, 
        name, 
        component, 
        cssProps: { 
            placement 
        } 
    };

    return View(props, $slots);
  },
});
