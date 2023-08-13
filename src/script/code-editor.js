import {CodeJar} from 'codejar'
import * as hljs from 'highlight.js'

export function CodeEditor(Alpine) {

    Alpine.directive('code-editor', (el, {}, {cleanup}) => {

        const value = el.getAttribute('value')
        const readonly = el.hasAttribute('readonly')
        const disabled = el.hasAttribute('disabled')
        el.classList.add('language-' + el.getAttribute('lang'))

        Alpine.bind(el, {
            'u-modelable': 'value',
            'u-data'() {
                return {
                    value: el.getAttribute('value')
                }
            },
            'u-init'() {
                console.log(hljs.default.highlightElement)
                const instance = CodeJar(el,hljs.default.highlightElement, {
                    tab: '  ',
                    catchTab: false
                })
                if(value) {
                    instance.updateCode(value)
                }

                if(readonly) {
                    el.setAttribute('contenteditable','false');
                    el.setAttribute('tabindex','0');
                }

                if(disabled) {
                    el.setAttribute('contenteditable','false');
                }

                let thisValue = instance.toString();
                instance.onUpdate(code => {
                    console.log('calling on update', code)
                    thisValue = code
                    this.$data.value = code
                })

                cleanup(() => {
                    instance.destroy()
                })
                
                this.$watch('value', (value) => {

                    if(thisValue === value) return;

                    console.log('calling updateCode', value)
                    instance.updateCode(value)
                    

                })        
            }
        })
        
    })
}
