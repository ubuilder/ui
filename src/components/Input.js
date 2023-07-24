import { Base } from "../utils.js";
import { FormField } from "./FormField.js";
import { View } from "./View.js";

// function props(objects, props) {
//   const result = {}
//   Object.keys(objects).map(key => {
//     result[key] = 
//   })
//   return {}
// }

export const Input = Base({
  render($props, $slots) {

    // const {inputProps, wrapperProps, ...restProps} = props({input: ['name', ], wrapper: ['label', ]}, $props)
    
    // const myProps = ['label', 'name', 'disabled'];
    
    const {
      component = "input",
      label,
      name,
      type,
      value,
      disabled,
      $disabled,
      $value,
      placeholder,
      required,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
      name,
      label,
    };

    const inputProps = {
      name,
      component,
      type,
      value,
      $value,
      placeholder,
      required,
      disabled,
      $disabled,
      tag: "input",
    };

    if (!value) {
      if (type === "number") {
        inputProps.value = 0;
      } else {
        inputProps.value = "";
      }
    } else {
      inputProps.value = value;
    }

    return FormField(props, View(inputProps));
  },
});
