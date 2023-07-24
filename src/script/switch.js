export function Switch(Alpine) {
  Alpine.directive("switch-input", (el) => {
    Alpine.bind(el, {
      "u-init"() {
        this.$data.name = el.getAttribute("name");
      },
      "u-on:change"(e) {
        this.$data[el.getAttribute("name")] = e.target.checked;
      },
    });
  });
}
