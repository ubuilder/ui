import { Base } from "../utils.js";
import { View } from "./View.js";

export const Tab = Base({
  render($props, $slots) {
    const { component = "tab", size = "md", ...restProps } = $props;

    const props = {
      ...restProps,
      component,
      cssProps: {
        size,
      },
    };

    return View(props, $slots);
  },
});

export const TabList = Base({
  render($props, $slots) {
    const {
      component = "tab-list",
      horizontal = true,
      size = "md",
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
      cssProps: {
        horizontal,
        size,
      },
    };

    return View(props, $slots);
  },
});

export const TabPanel = Base({
  render($props, $slots) {
    const { component = "tab-panel", size = "md", ...restProps } = $props;

    const props = {
      ...restProps,
      component,
      cssProps: {
        size,
      },
    };

    return View(props, $slots);
  },
});

export const TabItem = Base({
  render($props, $slots) {
    const {
      component = "tab-item",
      label,
      active = false,
      size = "md",
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      tag: 'button',
      component,
      cssProps: {
        size,
        active,
      },
    };

    return View(props, label ? label : $slots);
  },
});

export const TabContent = Base({
  render($props, $slots) {
    const { component = "tab-content", size = "md", ...restProps } = $props;

    const props = {
      ...restProps,
      component,
      cssProps: {
        size,
      },
    };

    return View(props, $slots);
  },
});
