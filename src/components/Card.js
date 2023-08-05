import { Base, extract} from "../utils.js";
import { View } from "./View.js";

export const Card = Base({
  render($props, $slots) {
    const {component, title, restProps} = extract($props, {
      component: "card",
      title: undefined
    })

    return View({component, ...restProps}, [title && CardHeader([CardTitle(title)]), $slots]);
  },
});

export const CardBody = Base({
  render($props, $slots) {
    const {props, restProps} = extract($props, {
      props: {
        component: "card-body",
      }
    })

    return View({...props, ...restProps}, $slots);
  },
});

export const CardHeader = Base({
  render($props, $slots) {
    const {props, restProps} = extract($props, {
      props: {
        component: "card-header",
      }
    })

    return View({...props, ...restProps}, $slots);
  },
});

export const CardTitle = Base({
  render($props, $slots) {
    const {props, restProps} = extract($props, {
      props: {
        component: "card-title",
      }
    })

    return View({...props, ...restProps}, $slots);
  },
});

export const CardFooter = Base({
  render($props, $slots) {
    const {props, restProps} = extract($props, {
      props: {
        component: "card-footer",
      }
    })

    return View({...props, ...restProps}, $slots);
  },
});

export const CardActions = Base({
  render($props, $slots) {
    const {props, restProps} = extract($props, {
      props: {
        component: "card-action",
      }
    })

    return View({...props, ...restProps}, $slots);
  },
});
