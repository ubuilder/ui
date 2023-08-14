export function Input(Alpine) {
  
    Alpine.directive("input", (el) => {
      const name = el.getAttribute('name')
      const value = el.getAttribute('value')

      Alpine.bind(el, {
        // initial value
        'u-init'() {
          if (name && this.$data[name]) {
            Alpine.bind(el, {
              "u-model": name,
            });
          }
          if(value && name && this.$data[name]) {
            this.$data[name] = value
          }
        },
        "u-on:input"(e) {
          // this.$data[el.getAttribute("name")] = e.target.value ;
        },
      });
    });
  }