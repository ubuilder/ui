import { Base } from "../utils.js";
import { View } from "./View.js";

export const Modal = Base({
  render($props, $slots) {
    const {
      component = "modal",
      open = false,
      persistent,
      name,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
      cssProps: { open },
      persistent,
      name,
    };

    return View(props, [
      View({ component: component + "-backdrop" }),
      View({ component: component + "-content" }, slots),
    ]);
  },
});

export const ModalBody = Base({
  render($props, $slots) {
    const { component = "modal-body", ...restProps } = $props;

    const props = {
      ...restProps,
      component,
    };
    return View(props, $slots);
  },
});
