// tooltip
// popover
// dropdown
// sidebar/navbar items
// import tippy from "tippy.js/dist/tippy.esm"

export function Popup(Alpine) {

    // use @floating-ui/dom similar to yesvelte
    Alpine.directive('popup', (el, {}, {evaluate, cleanup}) => {
        const trigger = el.getAttribute('trigger')
        const placement = el.getAttribute('placement')
        const target = el.getAttribute('target')

        // let targetEl;

        // if(target) {
        //     targetEl = evaluate(target) ?? el.previousElementSibling
        // } else {
        //     targetEl = el.previousElementSibling;
        // }

        // let instance = tippy(targetEl, {
        //     // hideOnClick: true,
        //     arrow: true,
        //     // placement: placement,
        //     // trigger: trigger,
        //     content: (reference) => reference.innerHTML
        // })[0]

        // cleanup(() => {
        //     instance.destroy()
        // })        
    })
}