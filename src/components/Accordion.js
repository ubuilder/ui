import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Accordions = Base({
  render($props, slots) {
    const {props, restProps} = extract($props, {
      props: {
        component: 'accordions',
        persistent: false
      }
    })

    return View({...props, ...restProps}, slots);
  },
});

export const Accordion = Base({
  render($props, slots) {
    const {props, header, body, restProps} = extract($props, {
      props: {
        component: 'accordion',
      },
      header: undefined,
      body: undefined
    })

    return View({...props, ...restProps}, [
      header && View({ component: props.component + "-header" }, header),
      View(
        { component: props.component + "-content" },
        body ? AccordionBody([body]) : slots
      ),
    ]);
  },
});

export const AccordionHeader = Base({
  render($props, $slots) {
    const {props, title, restProps} = extract($props, { 
      props: {
        component: "accordion-header", 
      },
      title: undefined
    });

    return View({...props, ...restProps}, [
      title && View({ tag: "h3", component: component + "-title" }, title),
      $slots || View({ component: "accordion-header-icon" }, ["^"]),
    ]);
  },
});

export const AccordionBody = Base({
  render($props, slots) {
    const {props, restProps} = extract($props, { 
      props: {
        component: "accordion-body"
      }
    });

    return View({...props, ...restProps}, slots);
  },
});
