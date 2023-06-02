import {
  queryAttr,
  query,
  toggleAttr,
  removeAttr,
  register,
  getAttr,
} from "./helpers";

const header = "u-accordion-header";
const content = "u-accordion-content";
const headerOpen = "u-accordion-header-open";
const contentOpen = "u-accordion-content-open";

export function Accordion($el) {
  queryAttr($el, header, (el) => {
    el.onclick = () => {
      const persistent = getAttr($el, "persistent");
      const id = getAttr(el, "id");

      console.log({ persistent });
      if (!persistent) {
        // remove open attribute
        queryAttr($el, headerOpen, (el) => removeAttr(el, headerOpen, ""));
        queryAttr($el, contentOpen, (el) => removeAttr(el, contentOpen, ""));
      }

      // toggle open of header
      toggleAttr(el, headerOpen);

      // toggle open of related content
      query($el, `[${content}][id="${id}"]`, (el) =>
        toggleAttr(el, contentOpen)
      );
    };
  });
}

register("u-accordions", Accordion);
