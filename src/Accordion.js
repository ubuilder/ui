import { View } from "./View.js";

export function Accordions($props, slots) {
  const { component = "accordions", persistent = false, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    jsProps: { persistent },
    onMount($el) {
      document.querySelectorAll("[u-accordion-header]").forEach((el) => {
        el.addEventListener("click", (event) => {
          const persistent =
            JSON.parse($el.getAttribute("u-accordions")).persistent ?? false;

          const id = el.getAttribute("u-accordion-header");

          if (!persistent) {
            $el
              .querySelector(".u-accordion-header-open")
              ?.classList.remove("u-accordion-header-open");
            $el
              .querySelector(".u-accordion-body-open")
              ?.classList.remove("u-accordion-body-open");
          }

          el.classList.toggle("u-accordion-header-open");

          $el
            .querySelector(`[u-accordion-body="${id}"]`)
            ?.classList.toggle("u-accordion-body-open");
        });
      });
    },
  };

  return View(props, slots);
}

let id = 0;
export function Accordion($props, slots) {
  console.log("call Accordion");
  const { component = "accordion", header, body, ...restProps } = $props;
  id++;

  const props = {
    ...restProps,
    component,
  };

  return View(props, [
    header && AccordionHeader({ id }, header),
    body && AccordionBody({ id }, body),
  ]);
}

export function AccordionHeader($props, slots) {
  const { component = "accordion-header", title, id, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    jsProps: id,
  };

  return View(props, [
    title ? View({ tag: "h3", component: component + "-title" }, title) : [],
    slots || View({ component: "accordion-header-icon" }, ["^"]),
  ]);
}

export function AccordionBody($props, slots) {
  const { component = "accordion-body", id, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    jsProps: id,
  };

  return View(props, [View({ component: component + "-content" }, slots)]);
}
