import { Base } from "../utils.js";
import { View } from "./View.js";

export const Breadcrumb = Base({
  render($props, $slots) {
    $props.component = "breadcrumb";
    $props["aria-label"] = "breadcrumb";

    return View({ ...$props, tag: "ol" }, $slots);
  },
});

export const BreadcrumbItem = Base({
  render($props, $slots) {
    const {
      active = false,
      disabled = false,
      component = "breadcrumb-item",
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      tag: "a",
      component,
      cssProps: {
        active,
        disabled,
      },
    };

    return View(
      { component: component + "-wrapper", tag: "li" },
      View(props, $slots)
    );
  },
});
