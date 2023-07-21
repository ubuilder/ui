import { FormField } from "./FormField";

export const CodeEditor = Base({
    render($props, $slots) {
        const {component='code-editor', lang = 'js', name, value, ...restProps} =$props 

        const props = {...restProps, component, lang, name};
     
        const codeEditorProps = {
            component,
            lang,
            name,
            value
        }

        return FormField(props, [View(codeEditorProps)])
    }
}) 