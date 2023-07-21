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





import { Base } from "../utils.js";
import { View } from "./View.js";

/**
* @type {import('.').Tooltip}
*/
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
      },
    };

    if(offset)      props["u-tooltip-offset"] = offset
    if(placement)   props["u-tooltip-placement"] = placement
    if(margin)      props["u-tooltip-margin"] = margin
    if(arrowMargin) props["u-tooltip-arrow-margin"] = arrowMargin
    if(trigger)     props["u-tooltip-trigger"] = trigger

    
    let content =  View(props,  $slots)
    if(arrow)content =  View(props, [$slots, TooltipArrow([View({tag: 'div', "u-tooltip-arrow-inside": ''})])])
    
    return content
  }
});

/**
* @type {import('.').TooltipArrow}
*/
export const TooltipArrow = Base({
  render($props, $slots){
    const {
      component = "tooltip-arrow",
      size = "md",
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
      cssProps: {
        size,
      },
    };

    return View(props, $slots);
  }
});
