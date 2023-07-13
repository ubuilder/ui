import Alpine from "alpinejs";
import { Accordion } from "./accordion";
import { Icon } from "./icon";
import { Form } from "./form";
<<<<<<< HEAD
import { AutoComplete } from "./autoComplete";
=======
import { Modal } from "./modal";
import { ClientSideRouting } from "./routing";
>>>>>>> c620cb2a00b588c1d71f3909ca25a3ce0ec3a1d9

export * from "./bind";
export * from "./tab";


// Handle checkbox and checkbox group
function checkbox(Alpine) {
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

function input(Alpine) {
  console.log("function input");
  Alpine.directive("input", (el) => {
    Alpine.bind(el, {
      "u-on:input"(e) {
        this.$data[el.getAttribute("name")] = e.target.value;
      },
    });
    // input
  });
}

function ulibsPlugin(Alpine) {
  document.body.setAttribute("u-data", "");

  ClientSideRouting(Alpine);
  checkbox(Alpine);
  input(Alpine);
  Form(Alpine);
  Accordion(Alpine);
  Icon(Alpine);
<<<<<<< HEAD
  AutoComplete(Alpine)
  
=======
  Modal(Alpine);
>>>>>>> c620cb2a00b588c1d71f3909ca25a3ce0ec3a1d9
}

document.addEventListener("DOMContentLoaded", () => {
  Alpine.prefix("u-");
  Alpine.plugin(ulibsPlugin);

  Alpine.start();
  window.Alpine = Alpine;
});
