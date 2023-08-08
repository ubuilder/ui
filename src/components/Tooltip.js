import { Base, extract } from "../utils.js";
import { View } from "./View.js";
import { Popup } from './Popup.js'
export const Tooltip = Base({
  render($props, $slots){
    const {props, cssProps, arrow, restProps} = extract($props, {
      
      cssProps: {
        target: undefined,
        offset: undefined,
        margin: undefined,
        arrowMargin: undefined,
        placement: 'bottom',
        trigger: 'hover'
      },
      arrow: true,
    })
  
 
    return Popup({arrow, ...cssProps, ...restProps, "u-tooltip": true}, $slots)
  }
});