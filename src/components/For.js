import { Base } from "../utils.js";
import { View } from "./View.js";

export const For = Base({
    render($props, $slots) {
        const {items, as} = $props

        return View({tag: 'template', $for: `${as} in ${items}`}, [
            $slots
        ])
    }
})

export const If = Base({
    render($props, $slots) {
        const {condition, not = false, ...props} = $props

        return View({tag: 'template', $if: condition}, View(props, [
            $slots
        ]))
    }
})

