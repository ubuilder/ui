export function Select(Alpine) {
    Alpine.directive('select', el => {

        const multiple = el.getAttribute('multiple')
        const name = el.getAttribute('name')

        // on change 
        Alpine.bind(el, {
            'u-on:change'(e) {
                console.log('select change', name, e, el.selectedOptions)
                if(multiple) {
                    let selectedValues = Array.from(e.target.selectedOptions).map(x => x.value)

                    console.log(selectedValues)

                    this.$data[name] = selectedValues
                } else {

                    const value = el.selectedOptions[0].value
                    console.log(value)
                    
                    this.$data[name] = value
                }
            }
        })
        
    })
}