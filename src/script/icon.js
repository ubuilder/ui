export function Icon(Alpine) {
  Alpine.directive("icon", (el) => {
    const iconName = el.textContent;

    const name = el.getAttribute("name");

    async function setIcon(value) {
      try {
        const res = await fetch(
          `https://unpkg.com/@tabler/icons@2.19.0/icons/${value}.svg`
        );
        const svg = await res.text();

        if (svg.indexOf("Cannot") > -1) {
          el.innerHTML = "";
          // console.log('icon not loaded', value)
        } else {
          el.innerHTML = svg;
        }
      } catch (err) {
        el.innerHTML = "";
        //
      }
    }

    if (name) {
      Alpine.bind(el, {
        "u-model": name,
        "u-init"() {
          this.$watch(name, (value) => setIcon(value));
        },
      });
    } else {
      Alpine.bind(el, {
        "u-init"() {
          setIcon(iconName);
        },
      });
    }
  });
}
