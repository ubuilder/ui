import { Base, extract} from "../utils.js";
import { View } from "./View.js";

export const Divider = Base({
  render($props, $slots) {
    const { props, restProps, cssProps } = extract($props, {
      props: {
        tag: "hr",
        component: "divider",
      },
      cssProps: {
        color: 'base',
      },
    });
    return View({...props, ...restProps, cssProps}, $slots);
  },
});
