import { Icon } from "./Icon.js";
import { Base, classname, extract } from "../utils.js";
import { View } from "./View.js";
import { If } from "./For.js";

export const Alert = Base({
  render($props, $slots) {
    const [props, restProps] = extract($props, {
      component: "alert",
      duration: 5000,
      icon: undefined,
      dismissible: false,
      title: undefined,
      cssProps: {
        autoClose: false,
        open: true,
        color: "primary",
      },
    });
    const component = props.component;

    const alertProps = {
      ...restProps,
      component: props.component,
      duration: props.autoClose ? props.duration : undefined,
      cssProps: props.cssProps,
    };

    const iconProps = {
      [classname(component + "-icon")]: "",
      color: props.cssProps.color,
      $color: props.cssProps.$color,
      name: props.icon,
      $name: props.$icon,
    };

    console.log({props}, {dismissible: props.dismissible})
    return View(alertProps, [
      View({ component: component + "-header" }, [
        props.icon ? Icon(iconProps) : [],
        View({ component: component + "-title" }, props.title ?? ""),
        
          props.dismissible ? View(
            { tag: "button", component: component + "-close" },
            Icon({ name: "x" })
          ) : [],
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
        placement,
      },
    };

    return View(props, $slots);
  },
});
