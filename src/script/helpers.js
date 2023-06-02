export function getContext($el, name) {
  let context = {};

  for (let attribute of $el.attributes) {
    if (attribute.name.startsWith("u-")) {
      context[attribute.name.substring(3)] = attribute.value;
    }
  }

  return context[name];
}

export function attr($el, key, value) {
  if (typeof value === "undefined") {
    const result = $el.getAttribute(key);

    if (result === "false") return false;
    if (result === "true") return true;

    return $el.getAttribute(key);
  }

  if (value == "") {
    $el.removeAttribute(key);
  } else if (value === true) {
    $el.setAttribute(key, "");
  } else {
    $el.setAttribute(key, value);
  }
}
export function getAttr($el, key) {
  const value = attr($el, key);

  if (value === "") return true;
  if (!value) return false;

  return value;
}

export function removeAttr($el, key) {
  attr($el, key, "");
}
export function setAttr($el, key, value = true) {
  attr($el, key, value);
}

export function toggleAttr($el, key) {
  if (getAttr($el, key)) {
    removeAttr($el, key);
  } else {
    setAttr($el, key);
  }
}

export function query($el, key, callback) {
  return $el.querySelectorAll(key).forEach((el) => callback(el));
}
export function queryAttr($el, key, callback) {
  return query($el, `[${key}]`, callback);
}

export function register(name, component) {
  queryAttr(document, name, component);
}
