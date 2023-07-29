import { Base, extract } from "../utils.js";
import { FormField } from "./FormField.js";
import { View } from "./View.js";

export const Textarea = Base({
  render($props, $slots) {
    const {props, wrapperProps, value, restProps} = extract($props, {
      props: {
        tag: 'textarea',
        component: 'textarea',
        name: undefined,
        placeholder: undefined,
        rows: 5,
      },
      wrapperProps: {
        component: 'textarea',
        label: undefined,
        name: undefined
      },
      value: undefined
    })

    props.$model = props.name

    return FormField({...restProps, ...wrapperProps}, View(props, value));
  },
});
