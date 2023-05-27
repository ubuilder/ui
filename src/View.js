import { tag } from "@ulibs/router";

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

const prefix = "u";
export function View(
  { tag: tagName = "div", component = "view", cssProps = {}, ...restProps },
  ...slots
) {
  let props = {
    class: classname(component, cssProps, restProps.class),
    scriptName: component,
    scriptProps: {},
  };

  let onMount = restProps.onMount ?? "";
  if (restProps.onClick) {
    props.script = `${component}($el, props) {
            function ${onMount}
            ${onMount ? "onMount($el)" : ""}
        $el.addEventListener("click", function ${restProps.onClick.toString()})
    }`;
  }

  console.log(props, restProps.onClick);
  return tag(tagName, props, ...slots);
}
