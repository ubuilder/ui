import { Base, extract } from "../utils.js";
import { FormField } from "./FormField.js";
import { View } from "./View.js";

export const CodeEditor = Base({
  render($props, $slots) {
    const { props, restProps, codeEditorProps } = extract($props, {
      props: {
        component: "code-editor",
        lang: "js",
        name,
        value,
      },

      codeEditorProps: {
        component,
        lang,
        name,
        value,
      },
    });

    return FormField({...props, ...restProps}, [View(codeEditorProps)]);
  },
});
