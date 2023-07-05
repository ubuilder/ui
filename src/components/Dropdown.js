import { Base } from "../utils.js";
import { View } from "./View.js";
import { Icon } from "./Icon.js";


/**
 * @type {import('./types').Dropdown}
 */
export const Dropdown = Base(($props, $slots) => {
  const {
    component = "dropdown",
    label,
    size = "md",
    arrow = true,
    trigger = 'click',//click or hover
    open = false,
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    component,
    arrow,
    trigger,
    "x-data": 
    `{
      open: ${open},
      trigger: ${trigger},
      timeout: undefined,
      toggle(){
        if(open) return this.close()
        else return this.open()
      },
      open(){
        this.open = true
      },
      close(){
        this.open = false
      },
    }`,
    "x-ref": "dropdown",
    ":click": "toggle()",
    ":hover": "if(trigger == 'hover'){clearTimeout(timeout); open()}",
    ":hover.outside": "timeout = setTimout(()=>{close()},300)",
    cssProps: {
      size,
    },    
  }


  if(trigger == 'hover'){
    props["x-on:hover"] = "open()"
  }

  $slots = [DropdownLabel({label ,arrow }), $slots]

  let content = View(props, $slots)
  return content;
});


/**
 * @type {import('./types').DropdownItems}
 */
export const DropdownItems = Base(($props, $slots) => {

  const {
    component = "dropdown-item",
    size = "md",
    href = undefined,
    icon = undefined,
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    component,
    link,
    icon,
    cssProps: {
      size,
    },    
  }

  if(href) {
    props.tag = 'a' 
    props.href = href
  }

  if(icon){
    $slots = [Icon({name: icon}), $slots]
  }


  let content = View(props, $slots)
  return content;
});


/**
 * @type {import { DropdownPanel } from "./types";}
 */
const DropdownPanel = Base(($props, $slots)=>{

  const {
    component = 'dropdown-panel',
    size = 'md',
    ...restProps
  } = $props

  const props = {
    ...restProps,
    "x-show": "open",
    ":click.outside": "close()",
    ":hover": "clearTimeout(timeout)",
    ":hover.outside": "if(trigger == 'hover') {timeout = setTimeout(()=>{close()}, 300)}",
    cssProps : {
      size: size,
    }
  }

  return View(props, $slots)
})


/**
 * @type {import { DropdownLabel } from "./types";}
 */
const DropdownLabel = Base(($props, $slots)=>{

  const {
    component = 'dropdown-label',
    text,
    arrow = true,
    size = 'md',
    ...restProps
  } = $props

  const props = {
    ...restProps,
    cssProps : {
      size: size,
    }
  }


  $props = [
    text, 
    Icon({name: "arrow-down", "x-show": "open"}), 
    Icon({name: "arrow-up", "x-show": "!open"}), 
    $slots
  ]


  return View(props, $props)
})

