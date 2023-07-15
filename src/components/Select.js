import { Base } from "../utils.js";
import { FormField } from "./FormField.js";
import { View } from "./View.js";

export const Select = Base({
  render($props, $slots) {
    const {
      key,
      text,
      name,
      label,
      multiple = false,
      placeholder = undefined,
      items = [],
      value = multiple ? [] : undefined,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component: "select",
      name,
      label,
    };

    const selectProps = {
      tag: "select",
      component: "select",
      value,
      name,
      multiple,
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

    return FormField(
      props,
      View(selectProps, [
        placeholder &&
          View(
            {
              component: "select-placeholder",
              tag: "option",
              value: "",
              hidden: true,
              selected: true,
              disabled: true,
            },
            placeholder
          ),
        ...items.map((item) =>
          View(
            {
              tag: "option",
              value: getKey(item),
              selected: multiple
                ? value.includes(getKey(item))
                : value === getKey(item),
            },
            getText(item)
          )
        ),
      ])
    );
  },
});
