import { Base } from "../utils.js";
import { View } from "./View.js";
import { Button } from './Button.js'

/**
 * @type {import('./types').Tab}
 */
export const Tab = Base(($props, $slots) => {
  const {
    component = "tab",
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
 * @type {import('./types').TabList}
 */
export const TabList = Base(($props, $slots) => {
  const {
    component = "tab-list",
    horizontal = true,
    size = "md",
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    component,
    horizontal,
    cssProps: {
      size,
    },    
  }

  return View(props, $slots)
});
/**
 * @type {import('./types').TabPanel}
 */
export const TabPanel = Base(($props, $slots) => {
  const {
    component = "tab-panel",
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
 * @type {import('./types').TabItem}
 */
export const TabItem = Base(($props, $slots) => {
  const {
    component = "tab-item",
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
    },    
  }
  if(active) props['u-tab-item-active'] = true

  return Button(props, label? label : $slots)
});

/**
 * @type {import('./types').TabContent}
 */
export const TabContent = Base(($props, $slots) => {
  const {
    component = "tab-content",
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
