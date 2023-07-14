import { Base } from "../utils.js";
import { View } from "./View.js";

export const Table = Base({
  render($props, $slots) {
    const { component = "table" } = $props;

    $props.component = component + "-wrapper";

    return View($props, [View({ tag: "table", component }, $slots)]);
  },
});

export const TableHead = Base({
  render($props, $slots) {
    $props.tag = "thead";
    $props.component = "table-head";

    return View($props, $slots);
  },
});

export const TableBody = Base({
  render($props, $slots) {
    $props.tag = "tbody";
    $props.component = "table-body";

    return View($props, $slots);
  },
});

export const TableCell = Base({
  render($props, $slots) {
    $props.tag = $props.head ? "th" : "td";
    $props.component = "table-cell";

    delete $props.head;

    return View($props, $slots);
  },
});

export const TableActions = Base({
  render($props, $slots) {
    $props.component = "table-actions";

    return View($props, $slots);
  },
});

export const TableFoot = Base({
  render($props, $slots) {
    $props.tag = "tfoot";
    $props.component = "table-foot";

    return View($props, $slots);
  },
});

export const TableRow = Base({
  render($props, $slots) {
    $props.tag = "tr";
    $props.component = "table-row";

    return View($props, $slots);
  },
});
