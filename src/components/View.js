import { tag } from "@ulibs/router";
import { classname, Base } from "../utils.js";

let id = 0;

/**
 * @type {import('./types').View}
 */
export const View = Base(($props, $slots) => {
  const {
    tag: tagName = "div",
    component = "view",
    cssProps = {},
    m,
    p,
    mx,
    px,
    ms,
    ps,
    my,
    py,
    me,
    pe,
    mt,
    pt,
    mb,
    pb,
    ...restProps
  } = $props;

  const viewCssProps = {
    m,
    p,
    mx,
    px,
    ms,
    ps,
    my,
    py,
    me,
    pe,
    mt,
    pt,
    mb,
    pb,
  };

  const cssAttributes = {};

  for (let prop in cssProps) {
    if (cssProps[prop])
      cssAttributes[classname(component + "-" + prop)] = cssProps[prop];
  }
  for (let prop in viewCssProps) {
    if (viewCssProps[prop])
      cssAttributes[classname("view-" + prop)] = viewCssProps[prop];
  }

  const props = {
    [classname(component)]: "",
    ...restProps,
    ...cssAttributes,
  };

  let scripts = [];

  for (let key in props) {
    if (key.startsWith("on") && key[2] >= "A" && key[2] <= "Z") {
      let event = key.substring(2).toLocaleLowerCase();
      let code = props[key].toString();

      delete props[key];

      if (event === "init") {
        continue;
      }

      scripts.push(
        `/* ${key} */ try {$el.addEventListener("${event}", ($event) => {\n\t${code}\n});}catch(err){console.log("Error: on (${key} of ${props.id})", err)}`
      );
    }
  }

  if (scripts.length > 0) {
    if (!props.id) props.id = component + "_" + id++;
    props.script =
      (props.script ?? "") +
      `;\n(() => {
  const $el = document.getElementById("${props.id}")
  /* onInit */ ${restProps.onInit ?? ""}

  ${scripts.join("\n")}
})();`;
  }

  return tag(tagName, props, $slots);
});
