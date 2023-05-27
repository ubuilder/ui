import { View } from "./View.js";

/**
 * @type {import('./types').Card}
 */
export function Card({ component = "card", title, ...restProps }, ...slots) {
  return View({ component, ...restProps }, [
    title && CardHeader({}, CardTitle({}, title)),
    ...slots,
  ]);
}

/**
 * @type {import('./types').CardBody}
 */
export function CardBody({ component = "card-body", ...restProps }, ...slots) {
  return View({ component, ...restProps }, ...slots);
}

/**
 * @type {import('./types').CardHeader}
 */
export function CardHeader(
  { component = "card-header", ...restProps },
  ...slots
) {
  return View({ component, ...restProps }, ...slots);
}

/**
 * @type {import('./types').CardTitle}
 */
export function CardTitle(
  { component = "card-title", ...restProps },
  ...slots
) {
  return View({ component, ...restProps }, ...slots);
}

/**
 * @type {import('./types').CardFooter}
 */
export function CardFooter(
  { component = "card-footer", ...restProps },
  ...slots
) {
  return View({ component, ...restProps }, ...slots);
}

/**
 * @type {import('./types').CardActions}
 */
export function CardActions(
  { component = "card-actions", ...restProps },
  ...slots
) {
  return View({ component, ...restProps }, ...slots);
}
