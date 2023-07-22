import { Base } from "../utils.js";
import { View } from "./View.js";

export const Icon = Base({
  render({ name, model, size, color, ...restProps }) {
    const result = View({
      ...restProps,
      tag: "span",
      component: "icon",
      cssProps: { size },
      textColor: color,
      name,
      model
    });
    return result;
  },
});
