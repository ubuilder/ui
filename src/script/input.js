export function Input(Alpine) {
  
    Alpine.directive("input", (el) => {
      Alpine.bind(el, {
        // initial value
        'u-init'() {
          if(el.value) {
            this.$data[el.getAttribute('name')] = el.value
          } else {
            el.value = this.$data[el.getAttribute('name')]
          }
        },
        "u-on:input"(e) {
          this.$data[el.getAttribute("name")] = e.target.value;
        },
      });
      // input
    });
  }