import { tag } from "@ulibs/router";
import { classname, Base } from "../utils.js";

// Not implemented
// border directions (only border bottom, ....)



//* bgColor (primary, secondary, success, info, warning, danger, light, dark)
//* textColor (primary, secondary, success, info, warning, danger, light, dark)
//* borderRadius (xs, sm, md, lg, xl)
//* borderColor (primary, secondary, success, info, warning, danger, light, dark)
//* borderSize (xs, sm, md, lg, xl)
//* d(flex, inline, block, grid, contents, inline-flex, inline-block, none)
//* dXs (flex, inline, block, grid, contents, inline-flex, inline-block, none)
//* dSm (flex, inline, block, grid, contents, inline-flex, inline-block, none)
//* dMd (flex, inline, block, grid, contents, inline-flex, inline-block, none)
//* dLg (flex, inline, block, grid, contents, inline-flex, inline-block, none)
//* dXl (flex, inline, block, grid, contents, inline-flex, inline-block, none)
//* align (start, center, end, baseline, stretch)
//* alignSelf (start, center, end, baseline, stretch)
//* justify (start, center, end, between, evenly, around)
//* justifySelf (start, center, end, between, evenly, around)
//* flexDirection (row, column, row-reverse, column-reverse)
//* flexDirectionXs (row, column, row-reverse, column-reverse)
//* flexDirectionSm (row, column, row-reverse, column-reverse)
//* flexDirectionMd (row, column, row-reverse, column-reverse)
//* flexDirectionLg (row, column, row-reverse, column-reverse)
//* flexDirectionXl (row, column, row-reverse, column-reverse)
//* gap (0, sm, md, lg, xl)
//* wrap (true, false) 
//* width (0, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, auto, 50, 100)
//* height (0, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, auto, 50, 100)


let id = 0;

/**
 * @type {import('./types').View}
 */
export const View = Base(($props, $slots) => {
  const {
    tag: tagName = "div",
    component = "view",
    cssProps = {},
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
    w,
    h,
    d,
    dXs,
    dSm,
    dMd,
    dLg,
    dXl,
    gap,
    align,
    alignSelf,
    justify,
    justifySelf,
    flexDirection,
    flexDirectionXs,
    flexDirectionSm,
    flexDirectionMd,
    flexDirectionLg,
    flexDirectionXl,
    bgColor,
    textColor,
    borderSize,
    border,
    borderColor,
    borderRadius,
    wrap,
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
    w,
    h,
    d,
    dXs,
    dSm,
    dMd,
    dLg,
    dXl,
    gap,
    align,
    wrap,
    flexDirection,
    flexDirectionXs,
    flexDirectionSm,
    flexDirectionMd,
    flexDirectionLg,
    flexDirectionXl,
    alignSelf,
    justify,
    justifySelf,
    bgColor,
    textColor,
    borderSize,
    border,
    borderColor,
    borderRadius,
  };

  const cssAttributes = {};

  for (let prop in cssProps) {
    if (cssProps[prop])
      if (cssProps[prop] === true) {
        cssAttributes[classname(component + "-" + prop)] = "";
      } else {
        cssAttributes[classname(component + "-" + prop)] = cssProps[prop];
      }
  }
  for (let prop in viewCssProps) {
    if (viewCssProps[prop])
      if (viewCssProps[prop] === true) {
        cssAttributes[classname("view-" + prop)] = "";
      } else {
        cssAttributes[classname("view-" + prop)] = viewCssProps[prop];
      }
  }

  const props = {
    [classname(component)]: "",
    ...restProps,
    ...cssAttributes,
  };

  let scripts = [];

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
    props.script =
      (props.script ?? "") +
      `;\n(() => {
  const $el = document.getElementById("${props.id}")
  /* onInit */ ${restProps.onInit ?? ""}

  ${scripts.join("\n")}
})();`;
  }

  return tag(tagName, props, $slots);
});
