import { Row } from "./GridSystem.js";
import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Fieldset = Base({
  render($props, $slots) {
    const { props, restProps, rowProps, title } = extract($props, {
      props: {
        component: "fieldset",
        tag: "fieldset",
      },
      rowProps: {
        gutter: undefined,
        align: undefined,
        justify: undefined,
      },
      title: undefined,
    });

    return View({ ...props, ...restProps }, [
      title && View({ tag: "legend" }, title),
      Row(rowProps, $slots),
    ]);
  },
});
