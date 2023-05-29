import { tag } from "@ulibs/router";

let id = 0;
const prefix = "u";
function classname(component, cssProps = {}, globalClasses = "") {
  let classes = [];

  classes.push([prefix, component].join("-"));

  Object.keys(cssProps).map((key) => {
    let value = cssProps[key];

    if (typeof value === "number" || typeof value === "string") {
      classes.push([prefix, component, key, value].join("-"));
    }
    if (value === true) {
      classes.push([prefix, component, key].join("-"));
    }
  });

  classes.push(globalClasses);
  return classes.filter(Boolean).join(" ");
}

/**
 * @type {import('./types').View}
 */
export function View($props, slots = []) {
  const {
    tag: tagName = "div",
    component = "view",
    cssProps = {},
    jsProps,
    onMount,
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

  const defaultCssProps = {
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

  let props = {
    ...restProps,
    id: component + "_" + id++,
    class: classname(
      "view",
      defaultCssProps,
      classname(component, cssProps, restProps.class)
    ).substring(classname("view").length + 1),
  };

  props.scriptName = classname(component);

  if (onMount) {
    let fnName = props.scriptName.replace(/\-/g, "_");
    props.onMount = "function " + onMount.toString().replace("onMount", fnName);

    props.onMount += `\ndocument.querySelectorAll("[${classname(
      component
    )}]").forEach($el => {
      ${fnName}($el, $el.getAttribute("${classname(component)}"))
    })`;
  }

  let events = [];
  Object.keys(restProps).map((key) => {
    if (key.startsWith("on") && key[2] >= "A" && key[2] <= "Z") {
      let event = key.substring(2).toLocaleLowerCase();
      let code = restProps[key].toString();

      events.push({ event, code });
      delete props[key];
    }
  });
  props.script = events
    .map(
      ({ code, event }) =>
        `document.getElementById("${props.id}").addEventListener("${event}", function ${code})`
    )
    .join("\n");

  if (typeof jsProps !== "undefined") {
    props.scriptProps = jsProps;
  }

  console.log(jsProps, props);

  if (Array.isArray(slots)) {
    return tag(tagName, props, ...slots.filter(Boolean));
  } else {
    return tag(tagName, props, slots);
  }
}
