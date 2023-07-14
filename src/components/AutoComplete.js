import { Base } from "../utils.js";
import { View } from "./View.js";
import { Icon } from "./Icon.js";

/**
 * @type {import('./types').AutoComplete}
 */
export const AutoComplete = Base({
  render($props, $slots) {
    const {
      component = "auto-complete",
      values = [],
      items = [],
      duplicates,
      controlInput,
      diacritics,
      selectOnTab,
      addPrecedence,
      dropdownParent,
      preload,
      hidePlaceholder,
      loadThrottle,
      allowEmptyOption,
      closeAfterSelect,
      hideSelected,
      maxItems,
      maxOptions,
      openOnFocus,
      delimiter,
      create,
      createOnBlur,
      createFilter,
      render,
      settings,
      placeholder,
      id,
      size = "md",
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
      placeholder,
      cssProps: {
        size,
      },
    };
    props["u-data"] = { items: items, values: values, id: id };
    props["id"] = id;
    const set = {
      duplicates,
      controlInput,
      diacritics,
      selectOnTab,
      addPrecedence,
      dropdownParent,
      preload,
      hidePlaceholder,
      loadThrottle,
      allowEmptyOption,
      closeAfterSelect,
      hideSelected,
      maxItems,
      maxOptions,
      openOnFocus,
      delimiter,
      create,
      createOnBlur,
      createFilter,
      render,
      ...settings,
    };

    props["u-auto-complete-settings"] = { ...set };

    const content = View(props, [
      AutoCompleteInput({ value: items, placeholder: placeholder }),
      $slots,
    ]);

    return content;
  },
});

/**
 * @type {import('./types').AutoCompleteInput}
 */
export const AutoCompleteInput = Base({
  render($props, $slots) {
    const {
      component = "auto-complete-input",
      value = undefined,
      size = "md",
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
      cssProps: {
        size,
      },
    };

    const input = View({
      tag: "input",
      AutoComplete: "off",
      placeholder: "select one",
      value: "item1,item2,item3",
    });

    const content = View(props, [input, $slots]);
    return content;
  },
});
