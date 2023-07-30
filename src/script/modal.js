export function Modal(Alpine) {
  Alpine.directive('modal-backdrop', (el) => {
    Alpine.bind(el, {
      'u-on:click'() {
        const isOpen = el.parentNode.hasAttribute('u-modal-open')
        const isPersistent = el.parentNode.hasAttribute('persistent');

        if(isOpen && !isPersistent) {
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

    Alpine.bind(el, {
      'u-data'() {
        return {
          isOpen: false,
          close() {

            this.$data.isOpen = false
            // el.removeAttribute('u-modal-open')
          },
        }
      },
      'u-bind:u-modal-open'() {
        return this.$data.isOpen;
      }
    })
  })

  Alpine.magic('modal', (el) => {
    return {
      open(name) {
        let query = "[u-modal]"
        if(name) query = query + `[name="${name}"]`
        
        const el = document.querySelector(query)
        if(el) {
          el.focus()
          Alpine.$data(el).isOpen = true
        }

      },
      close(name) {
        let query = "[u-modal-open]"
        if(name) query = query + `[name="${name}"]`
        
        const el = document.querySelector(query)

        if(el) {
          Alpine.$data(el).isOpen = false
        }
      }
    }
  })
}