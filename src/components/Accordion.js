import { Base } from "../utils.js";
import { View } from "./View.js";

/**
* @type {import('.').Accordions}
*/
export const Accordions = Base(($props, slots) => {
  const { component = "accordions", persistent = false, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    persistent,
  };

  return View(props, slots);
});

/**
* @type {import('.').Accordion}
*/
export const Accordion = Base(($props, slots) => {
  const { component = "accordion", header, body, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
  };

  return View(props, [
    header && View({  component: component + "-header" }, header),
    View(
      {  component: component + "-content" },
      body ? AccordionBody([body]) : slots
    ),
  ]);
});

/**
* @type {import('.').AccordionHeader}
*/
export const AccordionHeader = Base(($props, slots) => {
  const { component = "accordion-header", title, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
  };

  return View(props, [
    title && View({ tag: "h3", component: component + "-title" }, title),
    slots || View({ component: "accordion-header-icon" }, ["^"]),
  ]);
});

/**
* @type {import('.').AccordionBody}
*/
export const AccordionBody = Base(($props, slots) => {
  const { component = "accordion-body", ...restProps } = $props;

  const props = {
    ...restProps,
    component,
  };

  return View(props, slots);
});
