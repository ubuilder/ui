import { View } from "./View.js";

/**
 * @type {import('.').Card}
 */
export function Card({ component = "card", ...restProps }, ...slots) {
  return View({ component, ...restProps }, ...slots);
}

Card.Body = function ({ component = "card-body", ...restProps }, ...slots) {
  return View({ component, ...restProps }, ...slots);
};
Card.Header = function ({ component = "card-header", ...restProps }, ...slots) {
  return View({ component, ...restProps }, ...slots);
};
Card.Title = function ({ component = "card-title", ...restProps }, ...slots) {
  return View({ component, ...restProps }, ...slots);
};
Card.Footer = function ({ component = "card-footer", ...restProps }, ...slots) {
  return View({ component, ...restProps }, ...slots);
};
Card.Actions = function (
  { component = "card-actions", ...restProps },
  ...slots
) {
  return View({ component, ...restProps }, ...slots);
};
