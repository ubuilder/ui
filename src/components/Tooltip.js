import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Tooltip = Base({
  render($props, $slots){
    const {props, cssProps, arrow, restProps} = extract($props, {
      props: {
        component: 'tooltip',
      },
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
  
 
    //for later updates
    // if(arrow)content =  View(props, [$slots, TooltipArrow([View({tag: 'div', "u-tooltip-arrow-inside": ''},'')])])
    
    return View({...props, cssProps, ...restProps}, [
      arrow ? View({component: props.component + '-arrow'}) : [],
      $slots,
    ])
  }
});