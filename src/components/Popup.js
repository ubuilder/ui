import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Popup = Base({
  render($props, $slots) {
    const {props, cssProps, otherProps, restProps } = extract($props, {
      props: {
        component: 'popup',
      },
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

    return View({...props, cssProps, ...restProps}, [
      otherProps.persistant
      ? View({
        component: props.component + "-edge",
        ...(otherProps.focusAble ? { [`u-${props.component}-focus-able`]: "" } : ""),
      })
      : [],
      $slots,
      otherProps.arrow ? View({ component: props.component + "-arrow" }) : [],
    ]);
  },
});
