import { Base, extract } from "../utils.js";
import { FormField } from "./FormField.js";
import { View } from "./View.js";

export const Input = Base({
  render($props, $slots) {
    const {props, wrapperProps, restProps} = extract($props, {
      props: {
        component: 'input',
        tag: 'input',
        name: undefined,
        type: undefined,
        disabled: undefined,
        readonly: undefined,
        required: undefined,
        placeholder: undefined,
        value: undefined,
      },
      wrapperProps: {
        component: 'input',
        label: undefined,
        name: undefined
      }
    })

    if(props.name) props.$model = props.name

    if (!props.value) {
      if (props.type === "number") {
        props.value = 0;
      } else {
        props.value = "";
      }
    }

    return FormField({...wrapperProps, ...restProps}, View({...props}));
  },
});
