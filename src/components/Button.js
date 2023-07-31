import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Button = Base({
  render($props, $slots) {
    const {props, cssProps, restProps} = extract($props, {
      props: {
        href: undefined,
        tag: undefined,
        component: 'button',
      },
      cssProps: {
        active: false,
        disabled: false,
        size: 'md',
        link: false,
        color: undefined
      }
    });

    if(!props.tag) {
      if(props.href) {
        props.tag = 'a' 
      } else {
        props.tag = 'button'
      }
    }
    
    if(!props.color) {
      if(props.link) {
        props.color = 'base'
      }
    }

    return View({...restProps, cssProps, ...props}, $slots);
  },
});

export const ButtonGroup = Base({
  render($props, $slots) {
    const {component, cssProps, restProps} = extract($props, {
      component: 'button-group',
      cssProps: {
        compact: false
      }
    });
    
    return View({component, cssProps, ...restProps}, $slots);
  },
});
