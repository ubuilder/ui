function stringify(object) {
  if (object && typeof object === "object" || typeof object === "number") {
    return "'" + JSON.stringify(object) + "'";
  } else {
    return JSON.stringify(object);
  }
}

function renderAttributes({
  scriptName,
  scriptProps,
  onMount,
  script,
  ...object
}) {
  let result = "";
  if (scriptName) {
    result += " " + scriptName + "=" + stringify(scriptProps ?? {});
  }

  for (let [key, value] of Object.entries(object)) {
    if (value === false || typeof value === "undefined" || value === null)
      continue;

    if (key === "htmlHead") {
      continue;
    }
    if (value === "") {
      result += " " + key;
    } else {
      result += " " + key + "=" + stringify(value);
    }
  }
  return result;
}

function renderSlots(slots) {
  return slots.map((slot) => renderTemplate(slot)).join("");
}

export function renderTemplate(object) {
  if (typeof object === "undefined") return;
  if (Array.isArray(object))
    return object.map((item) => renderTemplate(item)).join("\n");
  if (object && typeof object === "object") {
    const { tag, slots, props } = object;

    if (!tag) return "";

    return (
      `<${tag}${renderAttributes(props)}>` + renderSlots(slots) + `</${tag}>`
    );
  }
  return object;
}


export function renderHead(object) {
  if (typeof object === "undefined") return;
  if (Array.isArray(object))
    return object.map((item) => renderHead(item)).join("\n");
  if (object && typeof object === "object") {
    const { tag, slots, props } = object;

    return [props?.htmlHead ? renderTemplate(props.htmlHead) :"", ...slots?.map((slot) => renderHead(slot))]
      .join("\n")
      .trim();
  }
  return "";
}