import { View } from "./View.js";

/**
 * @type {import('./types').Input}
 */
export function Input($props, slots) {
  const { value, component = "input", ref, type, label, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    ref,
    onMount($el) {
      console.log("onMount input", $refs, $el);
      $refs[$el.getAttribute("ref")] = $el;
    },
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
    View(props, slots),
  ]);
}
