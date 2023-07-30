import { Base } from "../utils.js";
import { View } from "./index.js";
import { FormField } from "./FormField.js";

export const DatePicker = Base({
  render($props, $slots) {
    const {
      component = "datepicker",
      value,
      $model,
      placeholder,
      size = "md",
      name,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      cssProps: {
        size,
      },
    };

    const inputPorps = {
      value,
      component,
      placeholder,
      tag: "input",
    };

    return FormField(props, [View(inputPorps), $slots]);
  },
});
