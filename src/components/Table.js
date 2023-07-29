import { Base, extract } from "../utils.js";
import { View } from "./View.js";

export const Table = Base({
  render($props, $slots) {
    const { component, restProps } = extract($props, {
      component: "table",
    });

    return View({ component: component + "-wrapper", ...restProps }, [
      View({ tag: "table", component }, $slots),
    ]);
  },
});

export const TableHead = Base({
  render($props, $slots) {
    const { tag, component, restProps } = extract($props, {
      component: "table-head",
      tag: "thead",
    });

    return View({ ...restProps, tag, component }, $slots);
  },
});

export const TableBody = Base({
  render($props, $slots) {
    const { tag, component, restProps } = extract($props, {
      component: "table-body",
      tag: "tbody",
    });

    return View({ ...restProps, tag, component }, $slots);
  },
});

export const TableCell = Base({
  render($props, $slots) {
    const { props, restProps } = extract($props, {
      props: {
        component: "table-cell",
        head: undefined,
      },
    });
    props.tag = props.head ? "th" : "td";

    return View({ ...restProps, ...props }, $slots);
  },
});

export const TableActions = Base({
  render($props, $slots) {
    const { component, restProps } = extract($props, {
      component: "table-actions",
    });

    return View({ ...restProps, component }, $slots);
  },
});

export const TableFoot = Base({
  render($props, $slots) {
    const { component, tag, restProps } = extract($props, {
      component: "table-foot",
      tag: "tfoot",
    });

    return View({ ...restProps, component, tag }, $slots);
  },
});

export const TableRow = Base({
  render($props, $slots) {
    const { component, tag, restProps } = extract($props, {
      component: "table-row",
      tag: "tr",
    });

    return View({ ...restProps, component, tag }, $slots);
  },
});
