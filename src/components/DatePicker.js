import { Base } from "../utils.js";
import { FormField } from "./FormField.js";
import { View } from "./View.js";

export const DatePicker = Base({
  render($props, $slots) {
    const {
      label,
      name,
      value,
      placeholder,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      label,
      name,
    };

    const inputProps = {
      name,
      component: 'datepicker',
      type: "date",
      value,
      placeholder,
      tag: "input",
    };

    if (!value) {
      inputProps.value = "";
    } else {
      inputProps.value = value;
    }

    return FormField(props, View(inputProps));
  },
});