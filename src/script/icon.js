export function Icon(Alpine) {
  Alpine.directive("icon", (el, {}, {evaluateLater, effect}) => {
    const iconName = el.getAttribute('u-bind:name');
    const staticName = el.getAttribute('name')

    async function setIcon(value) {
      try {
        const res = await fetch(
          `https://unpkg.com/@tabler/icons@2.19.0/icons/${value}.svg`
        );
        const svg = await res.text();

        if (svg.indexOf("Cannot") > -1) {
          el.innerHTML = "";
        } else {
          el.innerHTML = svg;
        }
      } catch (err) {
        el.innerHTML = "";
        //
      }
    }

    const evaluate = evaluateLater(iconName)

    effect(() => {
      evaluate((value) => {
        setIcon(value)
      })
    })

    if(staticName) {
      setIcon(staticName)
    }
  });
}
