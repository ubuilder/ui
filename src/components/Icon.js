import { Base } from "../utils.js";
import { View } from "./View.js";

/**
 * @type {import('./types').Icon}
 */
export const Icon = Base(({ name, size = "md" }) => {
  const result = View({
    tag: "span",
    component: "icon",
    cssProps: { size },
    name,
  });
  return result;
});
