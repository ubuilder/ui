export function Select(Alpine) {
  Alpine.directive("select", (el) => {
    const multiple = el.getAttribute("multiple");
    const name = el.getAttribute("name");

    // on change
    Alpine.bind(el, {
      "u-on:change"(e) {
        if (multiple) {
          const selectedValues = Array.from(e.target.selectedOptions).map(
            (x) => x.value
          );
          this.$data[name] = selectedValues;
        } else {
          const value = el.selectedOptions[0].value;
          this.$data[name] = value;
        }
      },
    });
  });
}
