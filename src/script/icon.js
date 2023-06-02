import { attr, getAttr, getContext, register } from "./helpers";

export function Icon($el) {
  console.log($el.outerHTML);
  const name = getAttr($el, "name");

  fetch(`https://unpkg.com/@tabler/icons@2.19.0/icons/${name}.svg`)
    .then((res) => res.text())
    .then((svg) => {
      //
      console.log("after fetch", svg);

      const size = attr($el, "u-icon-size");
      $el.outerHTML = svg.replace(
        "<svg xmlns",
        `<svg u-icon u-icon-size="${size}" xmlns`
      );
    });
}

register("u-icon", Icon);
