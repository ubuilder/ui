import { Base } from "../utils.js";
import { View } from "./View.js";

/**
* @type {import('.').Tabs}
*/
export const Tabs = Base({
  render($props, $slots){
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
  }
});

/**
* @type {import('.').TabsList}
*/
export const TabsList = Base({
  render($props, $slots) {
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
  }
});

/**
* @type {import('.').TabsPanel}
*/
export const TabsPanel = Base({
  render($props, $slots){
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
  }
});

/**
* @type {import('.').TabsItem}
*/
export const TabsItem = Base({
  render($props, $slots) {
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
      tag: 'button',
      cssProps: {
        size,
        active
      },    
    }
    if(active)props['u-tabs-item-active'] = "true"

    return View(props, $slots);
  }
});

/**
* @type {import('.').TabsContent}
*/
export const TabsContent = Base({
  render($props, $slots) {
    const {
      component = "tabs-content",
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
  }
});


