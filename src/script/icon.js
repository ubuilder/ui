export function Icon(Alpine) {
  Alpine.directive("icon", (el) => {
    const iconName = el.getAttribute("name");

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
