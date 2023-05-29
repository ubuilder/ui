import { View } from "./View.js";

/**
 * @type {import('./types').Card}
 */
export function Card($props, ...slots) {
  const { component = "card", title, ...restProps } = $props;

  const props = {
    ...restProps,
    component,
  };

  return View(props, [title && CardHeader({}, CardTitle({}, title)), ...slots]);
}

/**
 * @type {import('./types').CardBody}
 */
export function CardBody($props, ...slots) {
  const { component = "card-body", ...restProps } = $props;

  return View({ ...restProps, component }, ...slots);
}

/**
 * @type {import('./types').CardHeader}
 */
export function CardHeader($props, ...slots) {
  const { component = "card-header", ...restProps } = $props;

  return View({ ...restProps, component }, ...slots);
}

/**
 * @type {import('./types').CardTitle}
 */
export function CardTitle($props, ...slots) {
  const { component = "card-title", ...restProps } = $props;
  return View({ ...restProps, component }, ...slots);
}

/**
 * @type {import('./types').CardFooter}
 */
export function CardFooter($props, ...slots) {
  const { component = "card-footer", ...restProps } = $props;
  return View({ ...restProps, component }, ...slots);
}

/**
 * @type {import('./types').CardActions}
 */
export function CardActions($props, ...slots) {
  const { component = "card-actions", ...restProps } = $props;
  return View({ ...restProps, component }, ...slots);
}
