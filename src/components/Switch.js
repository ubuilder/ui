import { Base } from "../utils.js";
import { CheckboxInput } from "./Checkbox.js";
import { FormField } from "./FormField.js";

export const Switch = Base({
    render($props, $slots) {
      const {
        component = "switch",
        label,
        text,
        inline,
        name,
        checked,
        ...restProps
      } = $props;
  
      const props = {
        ...restProps,
        tag: "label",
        component,
        name,
        label,
        cssProps: {
          inline,
        },
      };
  
      const checkboxProps = {
        name,
        tag: "input",
        type: "checkbox",
        text,
        name,
        checked,
        component,
      };
  
      return FormField(props, CheckboxInput(checkboxProps));
    },
  });