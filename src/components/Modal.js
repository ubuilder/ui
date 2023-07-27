import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Modal = Base({
  render($props, $slots) {
    const {props, cssProps, restProps} = extract($props, {
      props: {
        component: 'modal',
        persistent: false,
        name: undefined,
        tabindex: 0,
      },
      cssProps: {
        open: false,
        size: undefined
      }
    })

    return View({...props, cssProps, ...restProps}, [
      View({ component: props.component + "-backdrop" }),
      View({ component: props.component + "-content" }, $slots),
    ]);
  },
});

export const ModalBody = Base({
  render($props, $slots) {
    const {props, restProps} = extract($props, {
      props: {
        component: 'modal-body'
      }
    })

    return View({...props, ...restProps}, $slots);
  },
});
