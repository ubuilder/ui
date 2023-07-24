import { Base } from "../utils.js";
import { View } from "./View.js";

export const Icon = Base({
  render({ $name, name, size, color, ...restProps }, slots) {
    const result = View({
      ...restProps,
      tag: "span",
      component: "icon",
      cssProps: { size },
      textColor: color,
      name,
      $name
    });
    return result;
  },
});
