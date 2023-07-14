const prefix = "u";

export function extract(...params) {
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

    console.log("classname: ", key, paramCase(key));

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

export function Base({render}) {
  return (...$) => {
    const { $props = {}, $slots = [] } = extract(...$);

    let props = {};
    for (let key in $props) {
      if (typeof $props[key] !== "undefined") {
        props[key] = $props[key];
      }
    }

    return render(props, $slots);
  };
}
