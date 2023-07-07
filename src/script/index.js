// export * from "./accordion";
// export * from "./icon";
// export * from "./form";

import Alpine from "alpinejs";

export * from "./bind";
export * from "./modal";
export * from "./tab";

function accordion(Alpine) {
  console.log("function accordion", Alpine.prefixed('accordions'));
  Alpine.directive("accordions", (el) => {
    console.log("accordions", el);
    function isPersistent() {
      console.log("function isPersistent");
      return el.getAttribute("persistent");
    }

    Alpine.bind(el, {
      "u-data"() {
        return {
          open: {},
          toggle: (id) => {
            // TODO: support persistent
            // if(isPersistent) {

            // }
            if (this.$data.open[id]) {
              delete this.$data.open[id];
            } else {
              this.$data.open[id] = true;
            }
            console.log(this.$data.open);
          },
          isOpen(id) {
            return this.$data.open[id];
          },
        };
      },
    });

    // let id=0

    const accordions = el.querySelectorAll("[u-accordion]");
    let id = 0;

    accordions.forEach((accordion) => {
      const myId = id++;
      console.log('register accordion', accordion)

      Alpine.bind(accordion.querySelector("[u-accordion-header]"), {
        "u-init"() {
          console.log(
            "init",
            this,
            this.$el.getAttribute("u-accordion-header-open")
          );
        },
        "u-on:click"() {
          this.$data.toggle(myId);
        },
        "u-bind:u-accordion-header-open"() {
          return this.$data.isOpen(myId);
        },
      });

      Alpine.bind(accordion.querySelector("[u-accordion-content]"), {
        "u-bind:u-accordion-content-open"() {
          return this.$data.isOpen(myId);
        },
      });
    });
  });
}

function icon(Alpine) {
  console.log("function icon");
  Alpine.directive("icon", (el, { expression }) => {
    const iconName = el.getAttribute("name");
    console.log(iconName);

    Alpine.bind(el, {
      "u-data"() {
        return {
          init() {
            fetch(
              `https://unpkg.com/@tabler/icons@2.19.0/icons/${iconName}.svg`
            )
              .then((res) => res.text())
              .then((svg) => {
                el.innerHTML = svg;
              });
          },
        };
      },
    });
  });
}

function checkbox(Alpine) {
  console.log("function checkbox");
  Alpine.directive("checkbox", (el) => {
    // checkbox
    // checkbox-input
    // checkbox-text
  });
}

function input(Alpine) {
  console.log("function input");
  Alpine.directive("input", (el) => {
    // input
  });
}

function form(Alpine) {
  console.log("function form");

  Alpine.directive("form", (el, a, b) => {
    // add all elements to u-data

    const fields = {};
    el.querySelectorAll("[u-input]").forEach((input) => {
      Alpine.bind(input, {
        // 'u-model'() {
        // return
        // }
        "u-on:input"(e) {
          this.$data[input.getAttribute("name")] = e.target.value;
        },
      });

      fields[input.getAttribute("name")] = input.value;
    });
    el.querySelectorAll("[u-checkbox-input]").forEach((input) => {
      Alpine.bind(input, {
        "u-on:change"(e) {
          this.$data[input.getAttribute("name")] = e.target.checked;
        },
      });

      fields[input.getAttribute("name")] = input.checked;
    });

    Alpine.bind(el, {
      "u-data"() {
        return {
          //
          ...fields,
        };
      },
    });

    Alpine.bind(el, {
      async "u-on:submit"(event) {
        const value = {};
        event.preventDefault();

        Object.keys(fields).map((key) => {
          value[key] = this.$data[key];
        });

        console.log(this.$data, value);
        const pathname = window.location.pathname;

        const url = pathname.endsWith("/")
          ? pathname.substring(0, pathname.length - 1)
          : pathname + "?" + el.getAttribute("action");

        try {
          // support function call
          console.log("function call");
          const result = await fetch(url, {
            method: "POST", // el.method,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(value),
          }).then((res) => res.json());

          console.log({ result });
        } catch (err) {
          console.log(err);
        }
      },
    });
  });
}

function ulibsPlugin(Alpine) {
  console.log("function ulibsPlugin");

  // Alpine.directive('view', (el) => {
  //   Alpine.bind(el, {
  //     'u-data'() {
  //       return {}
  //     }
  //   })
  // })
  
  form(Alpine);
  checkbox(Alpine);
  input(Alpine);
  accordion(Alpine);
  icon(Alpine);
}

console.log("set prefix");
Alpine.prefix("u-");
Alpine.plugin(ulibsPlugin);

Alpine.start();

window.Alpine = Alpine;
