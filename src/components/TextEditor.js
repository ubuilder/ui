import { Base } from "../utils.js";
import { View } from "./index.js";
import {  FormField } from "./FormField.js";

export const TextEditor = Base({
  render($props, $slots){
    const {
      type = 'simple',  // show the toolbar options quantity => basic, simple, standard, advanced 
      toolbar,
      value,
      $model,
      placeholder,
      component = "texteditor",
      size = "md",
      readOnly,
      disabled,
      name,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      ['u-texteditor']: true,
      ['u-texteditor-type']: type,
      ['u-texteditor-toolbar']: toolbar,
      ['u-texteditor-model']: $model,
      ['u-texteditor-readonly']: readOnly,
      cssProps: {
        type,
        size,
      },
    };    

    return FormField(props ,[
      View({tag: 'textarea', component: 'texteditor-textarea', name, value, disabled, placeholder }),
      View({"u-texteditor-target": ''}),
      $slots
    ])
  }
});

