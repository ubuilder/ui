export function Input(Alpine) {
  
    Alpine.directive("input", (el) => {
      Alpine.bind(el, {
        // initial value
        'u-init'() {
          this.$data[el.getAttribute('name')] = el.value
        },
        "u-on:input"(e) {
          this.$data[el.getAttribute("name")] = e.target.value;
        },
      });
      // input
    });
  }