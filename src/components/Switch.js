import { Base, extract } from "../utils.js";
import { CheckboxInput } from "./Checkbox.js";
import { FormField } from "./FormField.js";

export const Switch = Base({
    render($props, $slots) {
      const {wrapperProps, switchProps, cssProps, restProps} = extract($props, {
        wrapperProps: {
          component: 'switch',
          label: undefined,
        },
        switchProps: {
          component: 'switch',
          text: undefined,
          checked: false,
          name: undefined,
          disabled: undefined
        },
        cssProps: {
          inline: false
        }
      })
    
      switchProps.tag = "input"
      switchProps.type = "checkbox"
      
      return FormField({...wrapperProps, cssProps, ...restProps}, CheckboxInput(switchProps));
    },
  });