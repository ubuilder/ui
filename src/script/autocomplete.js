import TomSelect from 'tom-select'

export function Autocomplete(Alpine) {
  Alpine.directive('autocomplete', (el, {}, {cleanup, evaluateLater}) => {

    const create = el.hasAttribute('create')
    const onCreate = evaluateLater(el.getAttribute('u-on:create'));

    Alpine.bind(el, {
      'u-init'() {

        const instance = new TomSelect(el, {
          maxItems: el.hasAttribute('multiple') ? null : 1,
          create,
          onOptionAdd(value) {
            onCreate(() => {}, {scope: {$event: value}})
          }                    
        })    

        cleanup(() => {
          instance.destroy()
        })
      }
    })
  })

}

  // Alpine.directive('auto-complete', (el, {value, modifiers, expression, }, {Alpine, effect, evaluate, evaluateLater})=>{

    
  //  })
  // Alpine.directive('auto-complete-settings', (el, {value, modifiers, expression, }, {Alpine, effect, evaluate, evaluateLater})=>{

  //   let settings  = evaluate(expression)
  //   console.log(settings)
  //   let input = el.querySelector('input')
  //   var tomSelect = new TomSelect(input, {
  //       maxItems: null,
  //       valueField: 'value',
  //       labelField: 'text',
  //       searchField: 'text',
  //       options: evaluate("items"),
  //       items: evaluate('values'),
  //       persist: false,
  //       createOnBlur: true,
  //       create: true,
  //       ...settings,
  //   })
    

    
    
  //   Alpine.bind(el, {
  //     "u-init"(){
  //       let tomSelect = document.getElementById(this.id).querySelector('input')
  //       tomSelect = tomSelect.tomselect
        
  //       tomSelect.on('change', (val)=>{
  //         this.values = val.split(',')
  //         tomSelect.addOptions(this.items, true)
  //         tomSelect.refreshOptions()
  //       })
  //       tomSelect.on('option_add', (value, data)=>{
  //         let set = new Set(this.items)
  //         set.add(data)
  //         this.items = Array.from(set)
  //         tomSelect.addOptions(this.items, true)
  //         tomSelect.refreshOptions()
  //       })
  //     }
  //   })
  //  })


  

