
export function Tab(Alpine) {
    Alpine.directive('tab', (el) => {

        Alpine.bind(el, {
            'u-id'() {
                return ['tab']
            },
            'u-data'() {
                return {
                    active: undefined,
                    activate(id) {
                        id = +id.replace('tab-item-', '')
                        this.$data.active = id
                    },
                    isActive(id) {
                        if(!this.$data.active) {
                            this.$data.activate(id.replace('tab-panel', 'tab-item'));
                        }
                        console.log('isActive', id)
                        return +id.replace('tab-item-', '').replace('tab-panel-', '') === this.$data.active
                    }
                }
            }
        })                
    })

    Alpine.directive('tab-list', (el) => {
        Alpine.bind(el, {
            'u-id'() {
                return [this.$id('tab') + '-item']
            }
        })
    })

    Alpine.directive('tab-content', (el) => {
        Alpine.bind(el, {
            'u-id'() {
                return [this.$id('tab') + '-panel']
            }
        })
    })


    Alpine.directive('tab-item', (el) => {

        
        Alpine.bind(el, {
            'u-init'() {
                if(el.hasAttribute('u-tab-item-active')) {
                    this.$data.activate(el.id)
                }
                this.$watch('active', (value) => {
                    const myId = +el.id.replace('tab-item-', '')
                    if(value === myId) {
                        el.setAttribute('u-tab-item-active', '')
                    } else {
                        el.removeAttribute('u-tab-item-active')
                    }
                })
        
            },
            'u-bind:id'() {
                return this.$id('tab-item') 
            },
            'u-on:click'() {
                return this.$data.activate(el.id)
            }
        })
    })

    Alpine.directive('tab-panel', (el) => {
        Alpine.bind(el, {
            'u-bind:id'() {
                return this.$id('tab-panel') 
            },
            'u-bind:u-tab-panel-active'() {
                return this.$data.isActive(el.id)
            }     
        })
    })
}
