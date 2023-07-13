export function Select(Alpine) {
    Alpine.directive('select-input', el => {

        const multiple = el.getAttribute('multiple')
        const name = el.getAttribute('name')

        Alpine.bind(el, {
            'u-data'() {
                return {
                    [name]: multiple ? [] : undefined
                }
            }
        })

        // on change 
        Alpine.bind(el, {
            'u-on:change'(e) {
                console.log('change')
                const value = e.target.value;
                console.log('change to ', value)
            
                if(multiple) {

                    console.log('multiple')
                    const selectedValues = Array.from(this.$data[name])

                    if(selectedValues.includes(value)) {
                        selectedValues = selectedValues.filter(x => x !== value)
                    } else {
                        selectedValues = [...selectedValues, value]
                    }
                    console.log(selectedValues)
                    this.$data[name] = selectedValues

                } else {
                    console.log(value)
                    this.$data[name] = value
                }
            }
        })
        
    })
}