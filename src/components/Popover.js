import { Base, extract } from "../utils.js";
import { View } from "./View.js";
import { Popup } from "./Popup.js"

export const Popover = Base({
  render($props, $slots) {
    const {props, cssProps, otherProps, restProps } = extract($props, {
      
      cssProps: {
        size: undefined,
        target: undefined,
        offset: undefined,
        margin: undefined,
        placement: 'bottom',
        arrowMargin: undefined,
        trigger: 'click',
        flip: true,
        shift: true,
      },
      otherProps: {
        arrow: false,
        focusAble: true,
        persistant: true
      }
    })

    return Popup({...cssProps, ...otherProps, "u-popover": true}, $slots)
  },
});
