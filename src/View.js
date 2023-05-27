import { tag } from "@ulibs/router";

const prefix = "u";
function classname(component, cssProps, globalClasses) {
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
 * @type {import('.').View} 
 */
export function View(
  {
    tag: tagName = "div",
    component = "view",
    cssProps = {},
    onMount,
    ...restProps
  },
  ...slots
) {
  let props = {
    ...restProps,
    class: classname(component, cssProps, restProps.class),
    scriptName: component,
    scriptProps: {},
  };

  onMount ??= "";

  let events = [];
  Object.keys(restProps).map((key) => {
    if (key.startsWith("on") && key[2] >= "A" && key[2] <= "Z") {
      let event = key.substring(2).toLocaleLowerCase();
      let code = restProps.onClick.toString();
      events.push(`$el.addEventListener("${event}", function ${code})`);
    }
  });

  const mountScript = onMount
    ? `function ${onMount}
  ${onMount ? "onMount($el)" : ""}`
    : "";

  if (mountScript || events.length > 0) {
    props.script = `${component}($el, props) {
      ${mountScript}
      ${events.join("\n")}
    }`;
  }

  return tag(tagName, props, ...slots);
}
