export function Textarea(Alpine) {
    Alpine.directive('textarea-input', (el) => {


        // 
        Alpine.bind(el, {
            'u-on:input'(e) {
                this.$data[el.getAttribute('name')] = e.target.value
            }
        })
    })
}   