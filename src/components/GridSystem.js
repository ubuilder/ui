import { Base } from "../utils.js";
import { View } from "./View.js";

export const Container = Base(($props, $slots) => {
  $props.component = $props.component ?? "container";

  $props.cssProps = {
    size: $props.size,
  };
  delete $props["size"];

  return View($props, $slots);
});

export const Row = Base(($props, $slots) => {
  $props.component = $props.component ?? "row";
  $props.gutter = $props.gutter ?? "md";

  $props.cssProps = {
    gutter: $props.gutter,
  };
  delete $props["gutter"];

  return View($props, $slots);
});

export const Col = Base(($props, $slots) => {
  $props.component = $props.component ?? "col";
  $props.cols = $props.cols ?? 12;

  $props.cssProps = {
    cols: $props.cols,
  };
  delete $props["cols"];

  return View($props, $slots);
});
