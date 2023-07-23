import {Alert as AlertComponent} from '../components/Alert.js'

export function Alert(Alpine) {
    Alpine.directive('alert', (el) => {
        const isOpen = el.getAttribute('u-alert-open')       

        Alpine.bind(el, {
            'u-data'() {
                return {
                    isOpen,
                }
            },
            'u-bind:u-alert-open'() {
                return this.$data.isOpen
            }
        })
        
    })
    Alpine.directive('alert-close', (el) => {
        console.log('close button', el)
        Alpine.bind(el, {
            'u-on:click'() {
                this.$data.isOpen = false;
            }
        })
    })

    Alpine.directive('alert-auto-close', (el) => {
        Alpine.bind(el, {
            'u-init'() {
                setTimeout(() => {
                    this.$data.isOpen = false
                }, +el.getAttribute('duration') ?? 5000)
            }
        })
    })

    Alpine.magic('alert', (el) => {
        

        return (name, {title, icon = 'check', content = '', ...restProps}) => {
            const container = document.querySelector(`[u-alert-container][name="${name}"]`)

            const al = document.createElement('div')
            al.innerHTML = AlertComponent({title, icon, ...restProps}, content)
            console.log('add alert in ', {container, al})
            container.appendChild(al)

            
        }
    })
}