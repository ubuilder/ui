export function Table($props, slots) {
  const { component = "table", tag = "table", ...restProps } = $props;

  const props = {
    ...restProps,
    component: component + "-wrapper",
  };

  return View(props, [View({ tag, component }, slots)]);
}

export function TableHead($props, slots) {
  const { component = "table-head", tag = "thead", ...restProps } = $props;

  const props = {
    ...restProps,
    tag,
    component,
  };

  return View(props, slots);
}
export function TableBody($props, slots) {
  const { component = "table-body", tag = "tbody", ...restProps } = $props;

  const props = {
    ...restProps,
    tag,
    component,
  };

  return View(props, slots);
}

export function TableCell($props, slots) {
  const {
    component = "table-cell",
    head,
    tag = head ? "th" : "td",
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    tag,
    component,
  };

  return View(props, slots);
}

export function TableFoot($props, slots) {
  const { component = "table-foot", tag = "tfoot", ...restProps } = $props;

  const props = {
    ...restProps,
    tag,
    component,
  };

  return View(props, slots);
}

export function TableRow($props, slots) {
  const { component = "table-row", tag = "tr", ...restProps } = $props;

  const props = {
    ...restProps,
    tag,
    component,
  };

  return View(props, slots);
}
