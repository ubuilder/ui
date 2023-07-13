export function Modal(Alpine) {
  console.log('modal init')

  Alpine.directive('modal-backdrop', (el) => {
    Alpine.bind(el, {
      'u-on:click'() {
        const isOpen = el.parentNode.hasAttribute('u-modal-open')

        if(isOpen) {
          this.$modal.close()
        }
      }
    })
  })

  Alpine.directive('modal-content', (el) => {
    Alpine.bind(el, {
      'u-on:click.stop'() {
        // 
      }
    })
  })

  Alpine.directive('modal', el => {

    console.log('modal directive')
    
    Alpine.bind(el, {
      'u-data'() {
        return {
          close() {
            el.removeAttribute('u-modal-open')
          },
        }
      }
    })
  })

  Alpine.magic('modal', (...args) => {
    return {
      open(name) {
        const el = document.querySelector(`[name="${name}"]`)

        el.setAttribute('u-modal-open', '')
      },
      close() {

        const el = document.querySelector(`[u-modal-open]`)

        if(el) {
          el.removeAttribute('u-modal-open')
        }
      }
    }
  })
}