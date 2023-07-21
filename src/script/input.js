export function Input(Alpine) {
  
    Alpine.directive("input", (el) => {
      Alpine.bind(el, {
        "u-on:input"(e) {
          this.$data[el.getAttribute("name")] = e.target.value;
        },
      });
      // input
    });
  }