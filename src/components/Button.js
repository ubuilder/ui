import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Button = Base({
  render($props, $slots) {
    const [props, restProps] = extract($props, {
      href: undefined,
      tag: undefined,
      component: 'button',
      disabled: false,
      cssProps: {
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
        props.color = 'light'
      }
    }

    return View({...restProps, ...props}, $slots);
  },
});

export const ButtonGroup = Base({
  render($props, $slots) {
    const [props, restProps] = extract($props, {
      component: 'button-group',
      cssProps: {
        compact: false
      }
    });
    
    return View({...props, ...restProps}, $slots);
  },
});
