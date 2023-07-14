import { Base } from "../utils.js";
import { FormField } from "./FormField.js";
import { View } from "./View.js";

export const Input = Base({
  render($props, $slots) {
    const {
      component = "input",
      label,
      name,
      type,
      value,
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
      placeholder,
      required,
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
