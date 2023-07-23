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
        

        const alert = (name, {title, icon = 'check', content = '', ...restProps}) => {
            let container = document.querySelector(`[u-alert-container][name="${name}"]`)

            // first container
            if(!name) container = document.querySelector('[u-alert-container]');

            const al = document.createElement('div')
            al.innerHTML = AlertComponent({title, icon, ...restProps}, content)

            setTimeout(() => {
                container.appendChild(al)
            }, 100)
        }

        alert.success = (message, title = 'Success') => alert(undefined, {content: message, type: 'success', title, icon: 'check'});
        alert.info = (message, title = 'Info') => alert(undefined, {content: message, type: 'info', title, icon: 'info-circle'});
        alert.warning = (message, title = 'Warning') => alert(undefined, {content: message, type: 'warning', title, icon: 'info-triangle'});
        alert.error = (message, title = 'Error') => alert(undefined, {content: message, type: 'error', title, icon: 'alert-triangle'});
        
        return alert
    })
}