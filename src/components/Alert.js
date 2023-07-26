import { Icon } from "./Icon.js";
import { Base, classname, extract } from "../utils.js";
import { View } from "./View.js";
import { If } from "./For.js";

export const Alert = Base({
  render($props, $slots) {
    const {component, icon, title, dismissible, alertProps, iconProps, restProps, cssProps} = extract($props, {
      component: "alert",
      alertProps: {
        component: "alert",
        duration: 5000,
      },
      iconProps: {
        color: 'primary',
        icon: undefined
        // 
      },
      icon: undefined,
      title: undefined,
      dismissible: undefined,
      cssProps: {
        autoClose: false,
        open: true,
        color: "primary",
      },
    });

    iconProps.component = component + '-icon'
    iconProps.name = iconProps.icon
    delete iconProps['icon']


    return View({...alertProps, cssProps, ...restProps}, [
      View({ component: component + "-header" }, [
        icon ? Icon(iconProps) : [],
        View({ component: component + "-title" }, title ?? ""),
        
          dismissible ? View(
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
