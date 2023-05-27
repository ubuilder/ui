import { View } from "./View.js"

/**
 * @type {import('.').Button} 
 */
export function Button({tag = 'button', component = 'button', color="primary", ...props}, ...slots) {
    console.log(props)
    return View({...props, tag, component, cssProps: {color}}, ...slots)
}

Button.Group = function ({tag, component = 'button-group', compact = false, ...props}, ...slots) {
    return View({...props, tag, component}, ...slots)
}

