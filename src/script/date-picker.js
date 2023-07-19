export function DatePicker(Alpine) {
    console.log("function date picker");
    Alpine.directive("datepicker", (el) => {
      Alpine.bind(el, {
        "u-on:change"(e) {
          this.$data[el.getAttribute("name")] = e.target.value;
        },
      });
    });
  }