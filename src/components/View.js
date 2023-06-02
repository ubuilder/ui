import { tag } from "@ulibs/router";
import { classname, extract } from "../utils.js";

let id = 0;
export function Base(callback) {
  return (...$) => {
    const { $props = {}, $slots = [] } = extract(...$);

    return callback($props, $slots);
  };
}

/**
 * @type {import('./types').View}
 */
export const View = Base(($props, $slots) => {
  const {
    tag: tagName = "div",
    component = "view",
    cssProps = {},
    ctx = {},
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
    // class: classname(
    // "view",
    // viewCssProps,
    // restProps.class
    // classname(component, cssProps, restProps.class)
    // ),
  };
  console.log(props);

  let scripts = props.script ? [props.script] : [];

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
    props.script = `(() => {
  const $el = document.getElementById("${props.id}")
  /* onInit */ ${restProps.onInit ?? ""}

  ${scripts.join("\n")}
})();`;
  }

  for (let item in ctx) {
    if (ctx[item]) {
      props[classname(item)] = ctx[item];
    }
    delete props["ctx"];
  }

  return tag(tagName, props, $slots);
});

// const {
//   $props: {
//     tag: tagName = "div",
//     component = "view",
//     cssProps = {},
//     jsProps,
//     onMount,
//     m,
//     p,
//     mx,
//     px,
//     ms,
//     ps,
//     my,
//     py,
//     me,
//     pe,
//     mt,
//     pt,
//     mb,
//     pb,
//     ...restProps
//   },
//   $slots,
// } = extract($);

// const defaultCssProps = {
//   m,
//   p,
//   mx,
//   px,
//   ms,
//   ps,
//   my,
//   py,
//   me,
//   pe,
//   mt,
//   pt,
//   mb,
//   pb,
// };

// let props = {
//   ...restProps,
//   id: restProps.id ?? component + "_" + id++,
//   class: classname(
//     "view",
//     defaultCssProps,
//     classname(component, cssProps, restProps.class)
//   ).substring(classname("view").length + 1),
// };

// props.scriptName = classname(component);

// if (onMount) {
//   let fnName = props.scriptName.replace(/\-/g, "_");
//   props.onMount = "function " + onMount.toString().replace("onMount", fnName);

//   props.onMount += `\ndocument.querySelectorAll("[${classname(
//     component
//   )}]").forEach($el => {
//     ${fnName}($el, $el.getAttribute("${classname(component)}"))
//   })`;
// }

// let events = [];
// Object.keys(restProps).map((key) => {
//   if (key.startsWith("on") && key[2] >= "A" && key[2] <= "Z") {
//     let event = key.substring(2).toLocaleLowerCase();
//     let code = restProps[key].toString();

//     events.push({ event, code });
//     delete props[key];
//   }
// });
// props.script = events
//   .map(
//     ({ code, event }) =>
//       `document.getElementById("${props.id}").addEventListener("${event}", function ${code})`
//   )
//   .join("\n");

// if (typeof jsProps !== "undefined") {
//   props.scriptProps = jsProps;
// }

// if (Array.isArray($slots)) {
//   return tag(tagName, props, ...$slots.filter(Boolean));
// } else {
//   return tag(tagName, props, $slots);
// }
// }
