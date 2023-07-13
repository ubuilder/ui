export function Radio(Alpine) {
    Alpine.directive("radio", (el) => {
      if (el.parentNode.hasAttribute("u-radio-group")) return;
  
      const data = Alpine.$data(el, {
        value: false,
        name: "",
      });
  
      Alpine.bind(el, {
        data,
      });
    });
  

    Alpine.directive("radio-group", (el) => {
      const name = el.getAttribute("name");
      let value = [];
  
      el._model = {
        get() {
          return value;
        },
      };
  
      el.querySelectorAll("[u-radio-input]").forEach((item) => {
        if (item.checked) {
          value = [...value, item.value];
        }
  
        Alpine.bind(item, {
          "u-on:change"(event) {
            this.$data[name] = event.target.value;
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