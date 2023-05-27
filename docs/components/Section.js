import { View } from "../../src/View.js";

export function Section(
  { component = "section", title, description },
  ...slots
) {
  return View({ component }, [
    title && View({ tag: "h2", component: component + "-title", scriptProps: '#' + title }, title),
    description &&
      View({ tag: "p", component: component + "-description" }, description),
    ...slots,
  ]);
}
