import { Base } from "../utils.js";
import { FormField } from "./FormField.js";
import { View } from "./View.js";

export const Textarea = Base({
  render($props, $slots) {
    const {
      name,
      label,
      placeholder,
      rows = 5,
      value = "",
      component = "textarea",
      ...restProps
    } = $props;

    const props = { ...restProps, component, label };

    const textareaProps = {
      tag: "textarea",
      placeholder,
      name,
      component,
      rows,
      value
    };

    return FormField(props, View(textareaProps, value));
  },
});
