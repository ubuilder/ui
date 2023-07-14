import { Base } from "../utils.js";
import { View } from "./View.js";

/**
* @type {import('.').Modal}
*/
export const Modal = Base(($props, slots) => {
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
    name
  };

    return View(props, [
      View({ component: component + "-backdrop" }),
      View({ component: component + "-content" }, $slots),
    ]);
  },
});

/**
* @type {import('.').ModalBody}
*/
export const ModalBody = Base(($props, slots) => {
  const { component = "modal-body", ...restProps } = $props;

  const props = {
    ...restProps,
    component,
  };
  return View(props, slots);
});
