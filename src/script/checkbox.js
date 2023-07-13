export function Checkbox(Alpine) {
    Alpine.directive("checkbox", (el) => {
      if (el.parentNode.hasAttribute("u-checkbox-group")) return;
  
      const data = Alpine.$data(el, {
        value: false,
        name: "",
      });
  
      Alpine.bind(el, {
        data,
      });
    });
    Alpine.directive("checkbox-input", (el) => {
      if (el.parentNode.parentNode.hasAttribute("u-checkbox-group")) return;
  
      Alpine.bind(el, {
        "u-init"() {
          this.$data.name = el.getAttribute("name");
        },
        "u-on:change"(e) {
          this.$data[el.getAttribute("name")] = e.target.checked;
        },
      });
    });
  
    Alpine.directive("checkbox-group", (el) => {
      const name = el.getAttribute("name");
      let value = [];
  
      el._model = {
        get() {
          return value;
        },
      };
  
      el.querySelectorAll("[u-checkbox-input]").forEach((item) => {
        if (item.checked) {
          value = [...value, item.value];
        }
  
        Alpine.bind(item, {
          "u-on:change"(event) {
            value = Array.from(this.$data[name]);
  
            // toggle item
            if (value.includes(event.target.value)) {
              value = value.filter((x) => x !== event.target.value);
            } else {
              value = [...value, event.target.value];
            }
  
            this.$data[name] = value;
          },
        });
      });
  
      Alpine.bind(el, {
        "u-init"() {
          this.$data[name] = value;
        },
      });
    });
  }