import { Base, extract } from "../utils.js";
import { View } from "./View.js";
import { FormField } from "./index.js";


export const Autocomplete = Base({
  render($props, $slots) {
    const {props, wrapperProps, listProps, name, restProps} = extract($props, {
      wrapperProps: {
        component: 'autocomplete',
        label: undefined,
        name: undefined,
      },
      props: {
        component: 'autocomplete',
        multiple: false,
        onCreate: undefined,
        placeholder: '',
        create: false,
        readonly: false,
      },
      listProps: {
        value: undefined,
        items: undefined,
        key: undefined,
        text: undefined, 
      },
      label: undefined,
      name: undefined
      // TODO ...
    })
  
    console.log(props)
    const {items, value, key, text} = listProps
    delete props['items']
    delete props['value']
    delete props['key']
    delete props['text']
    delete props['label']
    delete props['$label']

    props.$model = name
    
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
    


    return FormField({...wrapperProps, ...restProps}, [
      View({tag: 'select', ...props}, [
        items.map(item => View({tag: 'option', value: getKey(item)}, getText(item)))
      ])
    ]); 
  }  
})