function renderScriptInternal(component) {
  if (Array.isArray(component)) {
    return component.map((x) => renderScriptInternal(x));
  }

  if (component && typeof component === "object") {
    return [
      {
        onMount: component.props.onMount,
        scriptName: component.props.scriptName,
        script: component.props.script,
      },
      renderScriptInternal(component.slots),
    ].flat(5);
  }
  return [];
}

export function renderScripts(component) {
  if (typeof component !== "object") return;

  const scripts = renderScriptInternal(component);

  let result = "";
  let scriptsObject = scripts.reduce((prev, curr) => {
    return { ...prev, [curr.scriptName]: curr.onMount };
  }, {});

  result += Object.keys(scriptsObject)
    .map((key) => scriptsObject[key])
    .join("\n");

  result += scripts.map((script) => script.script).join("\n");

  return result;
}
