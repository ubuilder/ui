import { Base } from "../utils.js";
import { View } from "./View.js";

export const Tooltip = Base({
  render($props, $slots){
    const {
      component = "tooltip",
      size = "md",
      arrow = true,
      offset,
      margin,
      placement = 'bottom',
      arrowMargin,
      trigger = "hover",//click, hover
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
      cssProps: {
        size,
        offset,
        placement,
        margin,
        arrowMargin,
        trigger
      },
    };    

    //for later updates
    // if(arrow)content =  View(props, [$slots, TooltipArrow([View({tag: 'div', "u-tooltip-arrow-inside": ''},'')])])
    
    return View(props, [
      arrow ? View({component: component + '-arrow'}) : [],
      $slots,
    ])
  }
});















//previous usage
//
// 
// import { Base } from "../utils.js";
// import { View } from "./View.js";

// /**
// * @type {import('.').Tooltip}
// */
// export const Tooltip = Base({
//   render($props, $slots){
//     const {
//       component = "tooltip",
//       size = "md",
//       ...restProps
//     } = $props;

//     const props = {
//       ...restProps,
//       component,
//       cssProps: {
//         size,
//       },
//     };
    
//     return View(props, $slots)
//   }
// });

// /**
// * @type {import('.').TootipContent}
// */
// export const TooltipContent = Base({
//   render($props, $slots){
//     const {
//       component = "tooltip-content",
//       size = "md",
//       arrow= true,
//       ...restProps
//     } = $props;

//     const props = {
//       ...restProps,
//       component,
//       role:"tooltip",
//       cssProps: {
//         size,
//       },
//     };

//     let content = View(props, $slots);
//     if(arrow){
//       content = View(props, [$slots,  TooltipArrow()]);
//     } 
//     return content;
//   }
// });

// /**
// * @type {import('.').TooltipSource}
// */
// export const TooltipSource = Base({
//   render($props, $slots){
//     const {
//       component = "tooltip-source",
//       size = "md",

//       ...restProps
//     } = $props;

//     const props = {
//       ...restProps,
//       component,
//       "aria-describedby":"tooltip",
//       cssProps: {
//         size,
//       },
//     };

//     return View(props, $slots);
//   }
// });


// /**
// * @type {import('.').TooltipArrow}
// */
// export const TooltipArrow = Base({
//   render($props, $slots){
//     const {
//       component = "tooltip-arrow",
//       size = "md",
//       ...restProps
//     } = $props;

//     const props = {
//       ...restProps,
//       component,
//       cssProps: {
//         size,
//       },
//     };

//     return View(props, $slots);
//   }
// });





