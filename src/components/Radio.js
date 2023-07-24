import { Base } from "../utils.js";
import { View } from "./View.js";
import { FormField } from "./FormField.js";


export const RadioInput = Base({
  render($props, $slots) {
    const {
      component = "radio",
      text,
      inline,
      value,
      name,
      checked,
      multiple,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      tag: "label",
      component,
      cssProps: {
        inline,
      },
    };

    const radioProps = {
      // name,
      tag: "input",
      type: "radio",
      // name,
      $model: name,
      value,
      checked,
      multiple,
      component: component + "-input",
    };

    return View(props, [
      View(radioProps),
      text && View({ tag: "span", component: component + "-text" }, text),
    ]);
  },
});

export const RadioGroup = Base({
  render($props, $slots) {
    const {
      component = "radio-group",
      label,
      name,
      items = [],
      value,
      text,
      key,
      inline = false,
      ...restProps
    } = $props;

    const props = { ...restProps, name, label, component };

    const radioGroupProps = {
      component,
      tag: "form",
      name,
      cssProps: {
        inline,
      },
    };

    function getKey(item) {
      if (key) {
        if (typeof key === "string") {
          return item[key];
        }
        if (typeof key === "function") {
          return key(item);
        }
      }
      return item;
    }
    function getText(item) {
      if (text) {
        if (typeof text === "string") {
          return item[text];
        }
        if (typeof text === "function") {
          return text(item);
        }
      }
      return item;
    }

    return FormField(props, [
      View(
        radioGroupProps,
        items.map((item) =>
          RadioInput({
            component: component + "-item",
            name,
            value: getKey(item),
            text: getText(item),
            checked: value === getKey(item),
          })
        )
      ),
    ]);
  },
});
