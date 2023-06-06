import {
  attr,
  getAttr,
  query,
  register,
  removeAttr,
  writable,
} from "./helpers";

function condition(val, sections) {
  if (sections.length === 1) {
    return val;
  } else if (sections.length === 3) {
    const [key, operator, value] = sections;
    if (operator === "==") {
      return val == value;
    } else if (operator === "!=") {
      return val != value;
    }
  }
  return false;
}

export function Bind($el) {
  const bind = getAttr($el, "u-bind");
  removeAttr($el, "u-bind");

  const ctx = {};

  if (bind) {
    const props = JSON.parse(bind);

    for (let key in props) {
      ctx[key] = writable(props[key]);
    }

    query($el, "*", (el) => {
      // ----------------------------------
      if (el.hasAttribute("u-bind-value")) {
        const key = el.getAttribute("u-bind-value");
        el.removeAttribute("u-bind-value");
        if (!ctx[key]) return;

        const { subscribe, set } = ctx[key];

        subscribe((val) => (el.value = val));

        el.addEventListener("input", (ev) => {
          set(ev.target.value);
        });
      }

      // ----------------------------------
      if (el.hasAttribute("u-bind-attr")) {
        const code = el.getAttribute("u-bind-attr");
        el.removeAttribute("u-bind-attr");

        const [key, _eq, ...value] = code.split(" ");

        if (!ctx[value[0]]) return;

        const { subscribe, set } = ctx[value[0]];

        subscribe((val) => {
          const cond = condition(val, value);

          if (value.length === 1) {
            el.setAttribute(key, value);
          } else {
            if (cond) {
              el.setAttribute(key, "");
            } else {
              el.removeAttribute(key);
            }
          }
        });
      }

      // ----------------------------------
      if (el.hasAttribute("u-bind-show")) {
        const code = el.getAttribute("u-bind-show");
        el.removeAttribute("u-bind-show");

        const sections = code.split(" ");
        const key = sections[0];

        if (!ctx[key]) return;
        const { subscribe, set } = ctx[key];

        subscribe((val) => {
          el.style.display = condition(val, sections) ? "" : "none";
        });
      }

      // ----------------------------------
      if (el.hasAttribute("u-bind-text")) {
        const key = el.getAttribute("u-bind-text");
        el.removeAttribute("u-bind-text");

        if (!ctx[key]) return;

        const { subscribe, set } = ctx[key];

        if (el.textContent) {
          set(el.textContent);
        }

        subscribe((val) => (el.textContent = val));
      }
      // ----------------------------------
      if (el.hasAttribute("u-bind-html")) {
        const key = el.getAttribute("u-bind-html");
        el.removeAttribute("u-bind-html");

        if (!ctx[key]) return;

        const { subscribe, set } = ctx[key];

        subscribe((val) => (el.innerHTML = val));
      }

      // ----------------------------------
      Array.from(el.attributes).forEach((attribute) => {
        if (attribute.name.startsWith("u-bind-")) {
          const event = attribute.name.substring("u-bind-".length);
          el.removeAttribute("u-bind-" + event);

          const code = attribute.value;
          el.addEventListener(event, () => {
            const [key, operator, ...value] = code
              .split(" ")
              .map((str) => str.trim());

            if (!ctx[key]) return;

            if (value.length === 1) {
              if (operator === "=") {
                if (!isNaN(value[0])) value[0] = +value[0];

                ctx[key].set(value[0]);
              } else if (operator === "!=") {
                if (value[0] === key) {
                  ctx[key].update((val) => !val);
                }
              } else if (operator === "+=") {
                ctx[key].update((val) => +val + +value[0]);
              } else if (operator === "-=") {
                ctx[key].update((val) => +val - +value[0]);
              }
            }
          });
        }
      });
    });
  }
}

register("u-bind", Bind);
