import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Spinner = Base({
  render($props, $slots) {
    const {props, restProps} = extract($props, {
      props: {
        component: 'spinner',
      },
      cssProps: {
        color: undefined,
        size: 'md'
      }
    })
 
    return View({...props, cssProps, ...restProps});
  },
});
