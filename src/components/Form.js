import { Base, classname } from "../utils.js";
import { View } from "./View.js";

export const Form = Base(($props, $slots) => {
  $props.tag = "form";
  $props.component = $props.component ?? "form";
  $props.method = $props.method ?? "POST";
  $props[classname("action")] = $props.action ?? "POST";

  return View($props, $slots);
});

export const FormField = Base(($props, $slots) => {
  $props.tag = "div";
  $props.component = $props.component ?? "form-field";

  const name = $props.name;
  const label = $props.label;

  delete $props["name"];
  delete $props["label"];

  return View($props, [
    label &&
      View(
        { component: $props.component + "-label", tag: "label", for: name },
        label
      ),
    $slots,
  ]);
});

export const Checkbox = Base(($props, $slots) => {
  $props.component = $props.component ?? "checkbox";
  $props.tag = "label";

  const name = $props.name;
  const value = $props.value;
  const checked = $props.checked;
  const label = $props.label;
  const multiple = $props.multiple;

  delete $props["name"];
  delete $props["value"];
  delete $props["checked"];
  delete $props["label"];
  delete $props["multiple"];

  $props.cssProps = {
    inline: $props.inline,
  };
  delete $props["inline"];

  return View($props, [
    View({
      tag: "input",
      type: "checkbox",
      name,
      value,
      checked,
      multiple,
      component: $props.component + "-input",
    }),
    label &&
      View({ tag: "span", component: $props.component + "-text" }, label),
  ]);
});

export const CheckboxGroup = Base(($props, $slots) => {
  const items = $props.items ?? [];
  delete $props["items"];

  const value = $props["value"] ?? [];
  delete $props["value"];

  const text = $props["text"];
  const key = $props["key"];
  delete $props["text"];
  delete $props["key"];

  const inline = $props["inline"];
  delete $props["inline"];

  const name = $props["name"];

  const component = $props["component"] ?? "checkbox-group";
  $props.component = component + "-wrapper";

  function getKey(item) {
    if ($props["key"]) {
      if (typeof key === "string") {
        return item[$props["key"]];
      }
      if (typeof key === "function") {
        return key(item);
      }
    }
    return item;
  }
  function getText(item) {
    if ($props["text"]) {
      if (typeof text === "string") {
        return item[$props["text"]];
      }
      if (typeof text === "function") {
        return text(item);
      }
    }
    return item;
  }

  return FormField($props, [
    View(
      { tag: "div", component, name },
      Each({ items }, ({ item }) =>
        Checkbox({
          name,
          inline,
          multiple: true,
          value: getKey(item),
          label: getText(item),
          checked: value.includes(getKey(item)),
        })
      )
    ),
  ]);
});

export const Radio = Base(($props, $slots) => {
  $props.component = $props.component ?? "radio";
  $props.tag = "label";

  const name = $props.name;
  const value = $props.value;
  const checked = $props.checked;
  const label = $props.label;

  delete $props["name"];
  delete $props["value"];
  delete $props["checked"];
  delete $props["label"];

  $props.cssProps = {
    inline: $props.inline,
  };
  delete $props["inline"];

  return View($props, [
    View({
      tag: "input",
      type: "radio",
      name,
      value,
      checked,
      component: $props.component + "-input",
    }),
    label &&
      View({ tag: "span", component: $props.component + "-text" }, label),
  ]);
});

export const RadioGroup = Base(($props, $slots) => {
  const items = $props.items ?? [];
  delete $props["items"];

  const value = $props["value"] ?? [];
  delete $props["value"];

  const text = $props["text"];
  const key = $props["key"];
  delete $props["text"];
  delete $props["key"];

  const inline = $props["inline"];
  delete $props["inline"];

  const name = $props["name"];

  const component = $props["component"] ?? "radio-group";
  $props.component = component + "-wrapper";

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

  return FormField($props, [
    View(
      { tag: "div", component, name },
      Each({ items }, ({ item }) =>
        Radio({
          name,
          inline,
          value: getKey(item),
          checked: value === getKey(item),
          label: getText(item),
        })
      )
    ),
  ]);
});

export const Each = Base(($props, $slots) => {
  return ($props.items ?? []).map((item, index) => $slots({ item, index }));
});

export const Input = Base(($props, $slots) => {
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

  const wrapperProps = {
    ...restProps,
    component: component + "-wrapper",
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

  return FormField(wrapperProps, [View(inputProps, $slots)]);
});

export const Textarea = Base(($props, $slots) => {
  // return View({}, [
  // ])
  const {name, label, placeholder, value = '', component = 'textarea', ...restProps} = $props


  const props = {...restProps, component, label}

  const textareaProps = { tag: 'textarea', placeholder, name, component: component + '-input'}
  
  return FormField(props, [View(textareaProps, value)]);
});

export const Select = Base(($props, $slots) => {
  // select component
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
    label,
  };

  const selectProps = {
    tag: "select",
    component: "select-input",
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

  return FormField(props, [
    View(
      selectProps,
      // props,

      [
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
      ]
    ),
  ]);
});

export const FileUpload = Base(($props, $slots) => {
  // file upload
});

export const Editor = Base(($props, $slots) => {
  // Editor component
});

export const Autocomplete = Base(($props, $slots) => {
  // Autocomplete
});

export const Datepicker = Base(($props, $slots) => {
  // Datepicker
});

export const Switch = Base(($props, $slots) => {
  // Switch component
});

export const Slider = Base(($props, $slots) => {
  // Slider
});
