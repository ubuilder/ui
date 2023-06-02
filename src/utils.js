const prefix = "u";

export function extract(...params) {
  let $props = {};
  let $slots = [];

  if (typeof params[0] === "object" && !Array.isArray(params[0])) {
    $props = params[0];

    if (typeof params[1] !== "undefined") {
      if (Array.isArray(params[1])) {
        $slots = params[1];
      } else {
        $slots = [params[1]];
      }
    }

    return { $props, $slots };
  }

  if (Array.isArray(params[0])) {
    $slots = params[0];
  } else {
    $slots = [params[0]];
  }

  return { $props, $slots };
}

export function classname(component, cssProps = {}, globalClasses = "") {
  let classes = [];

  if (component) {
    classes.push([prefix, component].join("-"));
  } else {
    classes.push(prefix);
  }

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
