import { renderScripts, renderTemplate, html } from "@ulibs/router";
import { View } from "../../src/View.js";

export function DocPage({component = 'page', name = '', ...restProps}, ...slots) {
    const page =  View({component, ...restProps}, [
        View({tag: 'a', component: component + '-back', href: '/components'}, 'Back'),
        name && View({tag: 'h1'}, name),
        ...slots
    ])

    const template = renderTemplate(page)
    const script = renderScripts(page)
    const style = View({tag: 'style'}, [])
    const title = View({tag: 'title'}, `UBuilder / Components / ` + name)

    return html({
        head: [title, style],
        body: [template, script]
    })
}