import { Base, View } from "./View.js";

let id = 0;
export const Accordions = Base(($props, slots) => {
  const { component = "accordions", persistent = false, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    ctx: { persistent },
    // script
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
    header && View({ ctx: { id }, component: component + "-header" }, header),
    View(
      { ctx: { id }, component: component + "-content" },
      body ? AccordionBody(body) : slots
    ),
  ]);
});

export const AccordionHeader = Base(($props, slots) => {
  const { component = "accordion-header", title, id, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    ctx: { id },
  };

  return View(props, [
    title ? View({ tag: "h3", component: component + "-title" }, title) : [],
    slots || View({ component: "accordion-header-icon" }, ["^"]),
  ]);
});

export const AccordionBody = Base(($props, slots) => {
  const { component = "accordion-body", id, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
    ctx: { id },
  };

  return View(props, slots);
});
