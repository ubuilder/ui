import { Base } from "../utils.js";
import { View } from "./View.js";

/**
* @type {import('.').Tabs}
*/
export const Tabs = Base(($props, $slots) => {
  const {
    component = "tabs",
    size = "md",
    ...restProps
  } = $props;

    const props = {
      ...restProps,
      component,
      cssProps: {
        size,
      },
    };

    return View(props, $slots);
});

/**
* @type {import('.').TabsList}
*/
export const TabsList = Base(($props, $slots) => {
  const {
    component = "tabs-list",
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

  return View(props, $slots)
});
/**
* @type {import('.').TabsPanel}
*/
export const TabsPanel = Base(($props, $slots) => {
  const {
    component = "tabs-panel",
    size = "md",
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    component,
    cssProps: {
      size,
    },    
  }

  return View(props, $slots)
});

/**
* @type {import('.').TabsItem}
*/
export const TabsItem = Base(($props, $slots) => {
  const {
    component = "tabs-item",
    label ,
    active = false,
    size = "md",
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    component,
    cssProps: {
      size,
      active
    },    
  }
  if(active)props['u-tabs-item-active'] = "true"

    return View(props, $slots);
});

/**
* @type {import('.').TabsContent}
*/
export const TabsContent = Base(($props, $slots) => {
  const {
    component = "tabs-content",
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
});


