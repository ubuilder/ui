import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Tabs = Base({
  render($props, $slots) {
    const { component, restProps } = extract($props, {
      component: "tabs",
    });

    return View(
      {
        ...restProps,
        component,
      },
      $slots
    );
  },
});

export const TabsList = Base({
  render($props, $slots) {
    const { component, restProps } = extract($props, {
      component: "tabs-list",
    });

    return View({ component, ...restProps }, $slots);
  },
});

export const TabsPanel = Base({
  render($props, $slots) {
    const { component, restProps } = extract($props, {
      component: "tabs-panel",
    });

    return View({ component, ...restProps }, $slots);
  },
});

export const TabsItem = Base({
  render($props, $slots) {
    const { props, cssProps, restProps } = extract($props, {
      props: {
        component: "tabs-item",
        tag: "button",
        type: 'button',
        disabled: false,
      },
      cssProps: {
        active: false,
        disabled: false
      },
    });

    return View({ ...props, cssProps, ...restProps }, $slots);
  },
});

export const TabsContent = Base({
  render($props, $slots) {
    const { props, cssProps, restProps } = extract($props, {
      props: {
        component: "tabs-content",
      },
    });

    return View({ ...props, cssProps, ...restProps }, $slots);
  },
});
