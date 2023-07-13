import { Base } from "../utils.js";
import { View } from "./View.js";
import { Button } from './Button.js'

/**
* @type {import('.').Tab}
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
* @type {import('.').TabList}
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
    cssProps: {
      horizontal,
      size,
    },    
  }

  return View(props, $slots)
});
/**
* @type {import('.').TabPanel}
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
* @type {import('.').TabItem}
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
      active
    },    
  }

  return Button(props, label? label : $slots)
});

/**
* @type {import('.').TabContent}
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
