import { Base } from '../utils.js';
import { FormField } from './FormField.js';
import { View } from './View.js';
/**
* @type {import('.').Checkbox}
*/
export const CheckboxInput = Base(($props, $slots) => {
    const {component = 'checkbox', text, inline, value, name, checked, multiple, ...restProps} = $props

    const props = {
        ...restProps,
        tag: 'label',
        component,
        cssProps: {
            inline
        }
    }

    const checkboxProps = {
        name,
        tag: "input",
        type: "checkbox",
        name,
        value,
        checked,
        multiple,
        component: component + "-input",

    }
    
    return View(props, [
      View(checkboxProps),
      text &&
        View({ tag: "span", component: component + "-text" }, text),
    ]);
  });


/**
* @type {import('.').Checkbox}
*/
export const Checkbox = Base(($props, $slots) => {
    const {component = 'checkbox', label, text, inline, value, name, checked, multiple, ...restProps} = $props

    const props = {
        ...restProps,
        tag: 'label',
        component,
        name,
        label,
        cssProps: {
            inline
        }
    }

    const checkboxProps = {
        name,
        tag: "input",
        type: "checkbox",
        text,
        name,
        value,
        checked,
        multiple,
        component,
    }
    
    return FormField(props, CheckboxInput(checkboxProps));
  });


  /**
* @type {import('.').CheckboxGroup}
*/
export const CheckboxGroup = Base(($props, $slots) => {
    const {component = 'checkbox-group', label, name, items = [], value = [], text, key, inline = false, ...restProps} = $props


    const props = {...restProps, name, label, component}

    const checkboxGroupProps = {
        component,
        tag: "div",
        cssProps: {
            inline,
        },
        name 
    }
      
    function getKey(item) {
      if (key) {
        if (typeof key === "string") {
          return item[key];
        }
        if (typeof key === "function") {
          return key(item);
        }
      }
      return item;
    }
    function getText(item) {
      if (text) {
        if (typeof text === "string") {
          return item[text];
        }
        if (typeof text === "function") {
          return text(item);
        }
      }
      return item;
    }
  
    return FormField(props, [
      View(
        checkboxGroupProps,
        items.map(item =>
          CheckboxInput({
            component: component + '-item',
            name,
            value: getKey(item),
            text: getText(item),
            checked: value.includes(getKey(item)),
          })
        )
      ),
    ]);
  });
  