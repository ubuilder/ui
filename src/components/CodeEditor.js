import { Base, extract } from "../utils.js";
import { FormField } from "./FormField.js";
import { View } from "./View.js";

export const CodeEditor = Base({
  render($props, $slots) {
    const { props, restProps, codeEditorProps } = extract($props, {
      props: {
        component: "code-editor",
      },

      codeEditorProps: {
        component: "code-editor",
        lang: "hbs",
        tag: "div",
        name: undefined,
        value: undefined,
        placeholder: undefined,
        readonly: false,
        disabled: false,
      },
    });

    if (codeEditorProps.name) {
      codeEditorProps.$model = codeEditorProps.name;
    }

    return FormField({ ...props, ...restProps }, [
      View({
        tag: "textarea",
        tabindex: "-1",
        $model: codeEditorProps.$model,
        component: codeEditorProps.component + "-textarea",
      }),
      View(codeEditorProps),
    ]);
  },
});
