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
      type: "checkbox",
      name,
      value,
      checked,
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
      { tag: "div", component },
      Each({ items }, ({ item }) =>
        Checkbox({
          name,
          inline,
          value: getKey(item),
          checked: value.includes(getKey(item)),
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
    component: component,
    type,
    value,
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
