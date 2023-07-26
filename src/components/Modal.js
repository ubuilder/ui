import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Modal = Base({
  render($props, $slots) {
    const [props, restProps] = extract($props, {
      component: 'modal',
      persistent: false,
      name: undefined,
      cssProps: {
        open: false,
      }
    })
    props.tabindex = 0

    return View({...props, ...restProps}, [
      View({ component: props.component + "-backdrop" }),
      View({ component: props.component + "-content" }, $slots),
    ]);
  },
});

export const ModalBody = Base({
  render($props, $slots) {
    const [props, restProps] = extract($props, {
      component: 'modal-body'
    })

    return View({...props, ...restProps}, $slots);
  },
});
