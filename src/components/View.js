import { tag } from "../core/index.js";
import { classname, Base } from "../utils.js";

// Not implemented
// border directions (only border bottom, ....)

      //* bgColor (primary, secondary, success, info, warning, danger, light, dark, base)
      //* textColor (primary, secondary, success, info, warning, danger, light, dark, base)
      //* borderRadius (xs, sm, md, lg, xl)
      //* borderColor (primary, secondary, success, info, warning, danger, light, dark)
      //* borderSize (xs, sm, md, lg, xl)

      //* align (start, center, end, baseline, stretch)
      //* alignSelf (start, center, end, baseline, stretch)
      //* justify (start, center, end, between, evenly, around)
      //* justifySelf (start, center, end, between, evenly, around)


export const View = Base({
  render($props, $slots) {
    const {
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

    let tagName = $props.tag ?? 'div'
    delete restProps['tag']

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
      if (typeof cssProps[prop] !== "undefined") {
        if(prop.startsWith('$')) continue;
        if (cssProps[prop] === true) {
          cssAttributes[classname(component + "-" + prop)] = "";
        } else {
          cssAttributes[classname(component + "-" + prop)] = cssProps[prop];
        }
      }
      if (typeof cssProps['$' + prop] !== "undefined") {
        if (cssProps['$' + prop] === true) {
          cssAttributes[classname('bind') + ':' + classname(component + "-" + prop)] = "";
        } else {
          cssAttributes[classname('bind') + ':' + classname(component + "-" + prop)] = cssProps['$' + prop];
        }
      }
    }
    for (let prop in viewCssProps) {
      if (typeof viewCssProps[prop] !== "undefined") {
        if(prop.startsWith('$')) continue;
        if (viewCssProps[prop] === true) {
          cssAttributes[classname("view-" + prop)] = "";
        } else {
          cssAttributes[classname("view-" + prop)] = viewCssProps[prop];
        }
      }
      if (typeof $props['$' + prop] !== "undefined") {

        cssAttributes[classname('bind') + ':' + classname("view-" + prop)] = $props['$' + prop];
      }
      
    }

    const props = {
      [classname(component)]: component === "view" ? false : "",
      ...restProps,
      ...cssAttributes,
    };

    for (let key in props) {
      if (key.startsWith("on") && key[2] >= "A" && key[2] <= "Z") {
        let event = key.substring(2).toLocaleLowerCase();

        if (event === "init") {
          props["u-init"] = props[key];
        } else {
          props["u-on:" + event] = props[key];
        }

        delete props[key];
      } else if (key.startsWith("$")) {
        if (key === "$if") {
          const uif = $props[key];
          delete $props[key]
          return View({tag: 'template', 'u-if': uif}, View($props, $slots))
        } else if (key === "$text") {
          props["u-text"] = props[key];
          if(!$props.tag) tagName = 'span'
        } else if (key === "$show") {
          props["u-show"] = props[key];
        } else if (key === "$data") {
          props["u-data"] = props[key];
        } else if (key === "$html") {
          props["u-html"] = props[key];
        } else if (key === "$for") {
          const ufor = $props[key];
          delete $props[key]
          return View({tag: 'template', 'u-for': ufor}, View($props, $slots))
        } else if (key === "$model") {
          props["u-model.fill"] = props[key];
        } else {
          props[`u-bind:` + key.substring(1)] = props[key];
        }
        delete props[key];
      } else {
        if (props[key] === true) {
          props[key] = "";
        }
      }
    }

    return tag(tagName, props, $slots.filter(Boolean));
  },
});
