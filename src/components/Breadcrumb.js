import { Base, extract } from "../utils.js";
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
    const { props, restProps, cssProps } = extract($props, {
      props: {
        component: "breadcrumb-item",
        tag: "a",
      },
      cssProps: {
        active,
        disabled,
      },
    });

    return View(
      { component: component + "-wrapper", tag: "li", ...restProps },
      View({...props, cssProps}, $slots)
    );
  },
});
