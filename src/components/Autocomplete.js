import { Base, extract } from "../utils.js";
import { View } from "./View.js";
import { FormField } from "./index.js";


export const Autocomplete = Base({
  render($props, $slots) {
    const [props, restProps] = extract($props, {
      component: 'autocomplete',
      name: undefined,
      value: undefined,
      items: undefined,
      key: undefined,
      text: undefined,
      multiple: false,
      onCreate: undefined,
      placeholder: '',
      create: false,
      readonly: false,
      label: undefined,
      // TODO ...
    })
  
    console.log(props)
    const {items, value, key, text, label, $label} = props
    delete props['items']
    delete props['value']
    delete props['key']
    delete props['text']
    delete props['label']
    delete props['$label']

    props.$model = props.name
    delete props['name']
    
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
    


    console.log({items, value, key, text, props})
    return FormField({component: props.component, label, $label, ...restProps}, [
      View({tag: 'select', ...props}, [
        items.map(item => View({tag: 'option', value: getKey(item)}, getText(item)))
      ])
    ]); 
  }  
})


// import { Icon } from "./Icon.js";

// /**
//  * @type {import('./types').AutoComplete}
//  */
// export const AutoComplete = Base({
//   render($props, $slots) {
//     const {
//       component = "auto-complete",
//       values = [],
//       items = [],
//       duplicates,
//       controlInput,
//       diacritics,
//       selectOnTab,
//       addPrecedence,
//       dropdownParent,
//       preload,
//       hidePlaceholder,
//       loadThrottle,
//       allowEmptyOption,
//       closeAfterSelect,
//       hideSelected,
//       maxItems,
//       maxOptions,
//       openOnFocus,
//       delimiter,
//       create,
//       createOnBlur,
//       createFilter,
//       render,
//       settings,
//       placeholder,
//       id,
//       size = "md",
//       ...restProps
//     } = $props;

//     const props = {
//       ...restProps,
//       component,
//       placeholder,
//       cssProps: {
//         size,
//       },
//     };
//     props["u-data"] = { items: items, values: values, id: id };
//     props["id"] = id;
//     const set = {
//       duplicates,
//       controlInput,
//       diacritics,
//       selectOnTab,
//       addPrecedence,
//       dropdownParent,
//       preload,
//       hidePlaceholder,
//       loadThrottle,
//       allowEmptyOption,
//       closeAfterSelect,
//       hideSelected,
//       maxItems,
//       maxOptions,
//       openOnFocus,
//       delimiter,
//       create,
//       createOnBlur,
//       createFilter,
//       render,
//       ...settings,
//     };

//     props["u-auto-complete-settings"] = { ...set };

//     const content = View(props, [
//       AutoCompleteInput({ value: items, placeholder: placeholder }),
//       $slots,
//     ]);

//     return content;
//   },
// });

// /**
//  * @type {import('./types').AutoCompleteInput}
//  */
// export const AutoCompleteInput = Base({
//   render($props, $slots) {
//     const {
//       component = "auto-complete-input",
//       value = undefined,
//       size = "md",
//       ...restProps
//     } = $props;

//     const props = {
//       ...restProps,
//       component,
//       cssProps: {
//         size,
//       },
//     };

//     const input = View({
//       tag: "input",
//       AutoComplete: "off",
//       placeholder: "select one",
//       value: "item1,item2,item3",
//     });

//     const content = View(props, [input, $slots]);
//     return content;
//   },
// });
