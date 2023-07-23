import { Base } from "../utils.js";
import { View } from "./View.js";

export const Popover = Base({
  render($props, $slots){
    const {
      component = "popover",
      size = "md",
      arrow = false,
      target,
      offset,
      margin,
      placement = 'bottom',
      arrowMargin,
      flip = true,
      shift = true,
      persistant = true,
      trigger = "click",//click, hover
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
      cssProps: {
        target,        
        size,
        offset,
        placement,
        margin,
        arrowMargin,
        trigger,
        flip,
        shift,
      },
    };    
    
    return View(props, [
      arrow ? View({component: component + '-arrow'}) : [],
      persistant ? View({component : component + "-edge"}): [],
      $slots
    ])
  }
});

