import { Base } from "../utils.js";
import { View, Input } from "./index.js";
import { FormField } from "./FormField.js";

export const DatePicker = Base({
  render($props, $slots) {
    const {
      component = "datepicker",
      value,
      type, //gregorian, jalaliFA, jalaliIR
      format,
      range, //e.g [2000, 2030]
      $model,
      placeholder,
      size = "md",
      name,
      options,
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
      // "u-input": true, //  i think the proble is wiht input element
      "u-form-field-input": true,
      placeholder,
      tag: "input",
      name,
      cssProps: {
        value,
        type,
        format,
        range,
        options,
        model:$model,
      },
    };

    return FormField(props, [View(inputPorps), $slots]);
  },
});
