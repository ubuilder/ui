import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Input}
 */
export const Input = Base(($props, $slots) => {
  const { value, component = "input", ref, type, label, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    ref,
    tag: "input",
  };

  if (!value) {
    if (type === "number") {
      props.value = 0;
    } else {
      props.value = "";
    }
  } else {
    props.value = value;
  }

  return View({ component: component + "-wrapper" }, [
    label &&
      View(
        {
          tag: "label",
          component: "label",
        },
        label
      ),
    View(props, $slots),
  ]);
});
