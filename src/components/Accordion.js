import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Accordions = Base({
  render($props, slots) {
    const [props, restProps] = extract($props, {
      component: 'accordions',
      persistent: false
    })

    return View({...props, ...restProps}, slots);
  },
});

export const Accordion = Base({
  render($props, slots) {
    const [props, restProps] = extract($props, {
      component: 'accordion',
      header: undefined,
      body: undefined
    })

    return View({component: props.component, ...restProps}, [
      props.header && View({ component: props.component + "-header" }, props.header),
      View(
        { component: props.component + "-content" },
        props.body ? AccordionBody([props.body]) : slots
      ),
    ]);
  },
});

export const AccordionHeader = Base({
  render($props, slots) {
    const [props, restProps] = extract($props, { 
      component: "accordion-header", 
      title: undefined
    });

    return View({component: props.component, ...restProps}, [
      title && View({ tag: "h3", component: component + "-title" }, title),
      slots || View({ component: "accordion-header-icon" }, ["^"]),
    ]);
  },
});

export const AccordionBody = Base({
  render($props, slots) {
    const [props, restProps] = extract($props, { 
      component: "accordion-body"
    });

    return View({...props, ...restProps}, slots);
  },
});
