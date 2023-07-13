export function Accordion(Alpine) {
  Alpine.directive("accordion", (el) => {
    Alpine.bind(el, {
      "u-id"() {
        return ["accordion"];
      },
    });
  });

  
  Alpine.directive("accordion-header", (el) => {
    Alpine.bind(el, {
      "u-bind:id"() {
        return this.$id("accordion");
      },
      "u-on:click"() {
        this.$data.toggle(this.$id("accordion"));
      },
      "u-bind:u-accordion-header-open"() {
        return this.$data.isOpen(this.$id("accordion"));
      },
    });
  });

  Alpine.directive("accordion-content", (el) => {
    Alpine.bind(el, {
      "u-bind:id"() {
        return this.$id("accordion");
      },
      "u-bind:u-accordion-content-open"() {
        return this.$data.isOpen(this.$id("accordion"));
      },
    });
  });

  Alpine.directive("accordions", (el) => {
    Alpine.bind(el, {
      "u-data"() {
        return {
          open: {},
          persistent: el.getAttribute("persistent"),
          toggle: (id) => {
            if (this.$data.persistent) {
              console.log("persistent", "close others");
            }
            if (this.$data.open[id]) {
              delete this.$data.open[id];
            } else {
              this.$data.open[id] = true;
            }
          },
          isOpen(id) {
            return this.$data.open[id];
          },
        };
      },
    });
  });
}
