import { Base } from "../utils.js";
import { View } from "./View.js";

/**
* @type {import('.').Table}
*/
export const Table = Base(($props, $slots) => {
  const { component = "table" } = $props;

  $props.component = component + "-wrapper";

  return View($props, [View({ tag: "table", component }, $slots)]);
});

/**
* @type {import('.').TableHead}
*/
export const TableHead = Base(($props, $slots) => {
  $props.tag = "thead";
  $props.component = "table-head";

  return View($props, $slots);
});

/**
* @type {import('.').TableBody}
*/
export const TableBody = Base(($props, $slots) => {
  $props.tag = "tbody";
  $props.component = "table-body";

  return View($props, $slots);
});

/**
* @type {import('.').TableCell}
*/
export const TableCell = Base(($props, $slots) => {
  $props.tag = $props.head ? "th" : "td";
  $props.component = "table-cell";

  delete $props.head;

  return View($props, $slots);
});

/**
* @type {import('.').TableActions}
*/
export const TableActions = Base(($props, $slots) => {
  $props.component = "table-actions";

  return View($props, $slots);
});

/**
* @type {import('.').TableFoot}
*/
export const TableFoot = Base(($props, $slots) => {
  $props.tag = "tfoot";
  $props.component = "table-foot";

  return View($props, $slots);
});

/**
* @type {import('.').TableRow}
*/
export const TableRow = Base(($props, $slots) => {
  $props.tag = "tr";
  $props.component = "table-row";

  return View($props, $slots);
});
