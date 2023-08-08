export function Icon(Alpine) {
    Alpine.directive("icon", (el, {}, {evaluateLater, effect}) => {
    const iconName = el.getAttribute('u-bind:name');
    const staticName = el.getAttribute('name')

    async function setIcon(value) {
      el.setAttribute('class','ti ti-' + value);
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
