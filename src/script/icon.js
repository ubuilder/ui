export function Icon(Alpine) {
  Alpine.directive("icon", (el) => {
    const iconName = el.getAttribute("name");
    const model = el.getAttribute("model");

    Alpine.bind(el, {
      "u-modelable": "value",
      'u-model': model,
      "u-data"() {
        return {
          value: iconName,
        };
      },
    });
    Alpine.bind(el, {
      "u-init"() {
        
        return this.$watch("value", async (value) => {
          try {
            const res = await fetch(`https://unpkg.com/@tabler/icons@2.19.0/icons/${value}.svg`)
            const svg = await res.text()

            if(svg.indexOf('Cannot') > -1) {
              el.innerHTML = ''
              // console.log('icon not loaded', value)
            } else {
              el.innerHTML = svg;
            }

          } catch (err) {
            el.innerHTML = ''
            //
          }
        });
      },
    });
  });
}
