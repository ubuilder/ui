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
      const persistent = getAttr($el, "u-persistent");
      const id = getAttr(el, "u-id");

      if (!persistent) {
        // remove open attribute
        queryAttr($el, headerOpen, (el) => removeAttr(el, headerOpen, ""));
        queryAttr($el, contentOpen, (el) => removeAttr(el, contentOpen, ""));
      }

      // add open for header
      toggleAttr(el, headerOpen);

      query($el, `[${content}][u-id="${id}"]`, (el) =>
        toggleAttr(el, contentOpen)
      );
    };
  });
}

register("u-accordions", Accordion);
