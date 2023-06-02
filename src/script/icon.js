import { getContext } from "./helpers";

export function Icon($el) {
  const name = getContext($el, "name");

  fetch(`https://unpkg.com/@tabler/icons@2.19.0/icons/${name}.svg`)
    .then((res) => res.text())
    .then((svg) => {
      const classes = $el.getAttribute("class");
      $el.outerHTML = svg.replace("icon icon-tabler", classes);
    });
}

document.querySelectorAll("u-icon").forEach(($el) => {
  Icon($el);
});
