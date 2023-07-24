const prefix = "u";

export function extract(allProps, names) {
  const restProps = { ...allProps };
  const result = names;

  Object.keys(names).map((key) => {
    if (typeof names[key] === "object") {
      result[key] = names[key];
      Object.keys(names[key]).map((key2) => {
        if (allProps[key2]) {
          result[key][key2] = allProps[key2];
          delete restProps[key2];
        }
        if (allProps["$" + key2]) {
          result[key]["$" + key2] = allProps["$" + key2];
          delete restProps["$" + key2];
        }
      });
    } else {
      if (allProps[key]) {
        result[key] = allProps[key];
        delete restProps[key];
      }
      if (allProps["$" + key]) {
        result["$" + key] = allProps["$" + key] ?? names["$" + key];
        delete restProps["$" + key];
      }
    }
  });

  return [result, restProps];
}

export function getPropsAndSlots(...params) {
  let $props = {};
  let $slots = [];

  if (typeof params[0] === "object" && !Array.isArray(params[0])) {
    $props = params[0];

    if (typeof params[1] !== "undefined") {
      if (Array.isArray(params[1])) {
        $slots = params[1];
      } else if (typeof params[1] === "function") {
        $slots = params[1];
      } else {
        $slots = [params[1]];
      }
    }

    return { $props, $slots };
  }

  if (Array.isArray(params[0])) {
    $slots = params[0];
  } else if (typeof params[1] === "function") {
    $slots = params[1];
  } else {
    $slots = [params[0]];
  }

  return { $props, $slots };
}

export function classname(component, cssProps = {}, globalClasses = "") {
  let classes = [];

  if (component) {
    classes.push([prefix, paramCase(component)].join("-"));
  } else {
    classes.push(prefix);
  }

  function paramCase(str) {
    return str
      .split("")
      .map((char) => {
        if ((char >= "A") & (char <= "Z")) {
          return "-" + char.toLowerCase();
        }
        return char;
      })
      .join("");
  }

  Object.keys(cssProps).map((key) => {
    let value = cssProps[key];
    if (typeof value === "number" || typeof value === "string") {
      classes.push([prefix, component, paramCase(key), value].join("-"));
    }
    if (value === true) {
      classes.push([prefix, component, paramCase(key)].join("-"));
    }
  });

  classes.push(globalClasses);
  return classes.filter(Boolean).join(" ");
}

export function Base({ render }) {
  return (...$) => {
    const { $props = {}, $slots = [] } = getPropsAndSlots(...$);

    let props = {};
    for (let key in $props) {
      if (typeof $props[key] !== "undefined") {
        props[key] = $props[key];
      }
    }

    return render(props, $slots);
  };
}
