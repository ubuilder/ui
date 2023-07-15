import { Base } from "../utils.js";
import { View } from "./View.js";

export const Accordions = Base({
  render($props, slots) {
    const {
      component = "accordions",
      persistent = false,
      ...restProps
    } = $props;

    const props = {
      ...restProps,
      component,
      persistent,
    };

    return View(props, slots);
  },
});

export const Accordion = Base({
  render($props, slots) {
    const { component = "accordion", header, body, ...restProps } = $props;

    const props = {
      ...restProps,
      component,
    };

    return View(props, [
      header && View({ component: component + "-header" }, header),
      View(
        { component: component + "-content" },
        body ? AccordionBody([body]) : slots
      ),
    ]);
  },
});

export const AccordionHeader = Base({
  render($props, slots) {
    const { component = "accordion-header", title, ...restProps } = $props;

    const props = {
      ...restProps,
      component,
    };

    return View(props, [
      title && View({ tag: "h3", component: component + "-title" }, title),
      slots || View({ component: "accordion-header-icon" }, ["^"]),
    ]);
  },
});

export const AccordionBody = Base({
  render($props, slots) {
    const { component = "accordion-body", ...restProps } = $props;

    const props = {
      ...restProps,
      component,
    };

    return View(props, slots);
  },
});
