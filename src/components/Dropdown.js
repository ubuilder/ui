import { Base, extract } from "../utils.js";
import { View } from "./View.js";
import { Icon } from "./Icon.js";
import { Button } from "./Button.js";
import { Popup } from "./Popup.js";

export const Dropdown = Base({
  render($props, $slots) {
    const { props, restProps, cssProps , arrow} = extract($props, {
      props: {
        component: "dropdown",
        label: undefined,
        open: false,
        trigger: "click", //click or hover
        tabindex: '0'
      },
      cssProp: {
        size : undefined,
      },
      arrow: true
    });
    if(arrow)props['u-dropdown-arrow'] = 'true'
 
    props["u-dropdown-click"] = "true";
    if (props.trigger == "hover") {
      props["u-dropdown-hover"] = "true";
    }

    return View({...props, cssProps, ...restProps}, $slots);
  },
});

export const DropdownItem = Base({
  render($props, $slots) {
    const { props, restProps, cssProps } = extract($props, {
      props: {
        component: "dropdown-item",
        label: undefined,
        href: undefined,
        icon: undefined,
      },
      cssProps: {
        size: undefined,
      },
    });

    $slots = [
      props.icon && Icon(props.icon),
      props.label && View({ tag: "span" }, props.label),
      $slots,
    ];

    let content = props.href
      ? View({ ...props, tag: "a", href:props.href, ...restProps }, $slots)
      : Button({...props, ...restProps}, $slots);
    return content;
  },
});

export const DropdownPanel = Base({
  render($props, $slots) {
    const { props, restProps, cssProps } = extract($props, {
      props: {
        trigger:'click'
      },
      cssProps: {
        size: 'md',
      },
    });
    props['u-dropdown-panel'] = 'true'

    return Popup(props, $slots);
  },
});
