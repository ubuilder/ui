import { Base } from "../utils.js";
import { View } from "./View.js";

let id = 0;
export const Accordions = Base(($props, slots) => {
  const { component = "accordions", persistent = false, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    persistent,
  };

  return View(props, slots);
});

export const Accordion = Base(($props, slots) => {
  const { component = "accordion", header, body, ...restProps } = $props;
  id++;

  const props = {
    ...restProps,
    component,
  };

  return View(props, [
    header && View({ id, component: component + "-header" }, header),
    View(
      { id, component: component + "-content" },
      body ? AccordionBody(body) : slots
    ),
  ]);
});

export const AccordionHeader = Base(($props, slots) => {
  const { component = "accordion-header", title, id, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    id,
  };

  return View(props, [
    title ? View({ tag: "h3", component: component + "-title" }, title) : [],
    slots || View({ component: "accordion-header-icon" }, ["^"]),
  ]);
});

export const AccordionBody = Base(($props, slots) => {
  const { component = "accordion-body", ...restProps } = $props;

  const props = {
    ...restProps,
    component,
  };

  return View(props, slots);
});
