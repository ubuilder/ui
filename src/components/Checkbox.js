import { Base } from "../utils.js";
import { FormField } from "./FormField.js";
import { View } from "./View.js";

export const CheckboxInput = Base({
  render($props, $slots) {
    const {
      component = "checkbox",
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

    const checkboxProps = {
      name,
      tag: "input",
      type: "checkbox",
      $model: name,
      value,
      checked,
      multiple,
      component: component + "-input",
    };

    return View(props, [
      View(checkboxProps),
      View({ tag: "span", component: component + "-text" }, text?? []),
    ]);
  },
});

export const Checkbox = Base({
  render($props, $slots) {
    const {
      component = "checkbox",
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

export const CheckboxGroup = Base({
  render($props, $slots) {
    const {
      component = "checkbox-group",
      label,
      name,
      items = [],
      value = [],
      text,
      key,
      inline = false,
      ...restProps
    } = $props;

    const props = { ...restProps, name, label, component };

    const checkboxGroupProps = {
      component,
      tag: "div",
      cssProps: {
        inline,
      },
      name,
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
   
    console.log({items, key: getKey(items[0]), text: getText(items[0])})

    return FormField(props, [
      View(
        checkboxGroupProps,
        items.map((item) =>
          CheckboxInput({
            component: component + "-item",
            name,
            value: getKey(item),
            text: getText(item),
            checked: value.includes(getKey(item)),
          })
        )
      ),
    ]);
  },
});
