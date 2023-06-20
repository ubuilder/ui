(function (exports) {
  'use strict';

  function attr($el, key, value) {
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
  function getAttr($el, key) {
    const value = attr($el, key);

    if (value === "") return true;
    if (!value) return false;

    return value;
  }

  function removeAttr($el, key) {
    attr($el, key, "");
  }
  function setAttr($el, key, value = true) {
    attr($el, key, value);
  }

  function toggleAttr($el, key) {
    if (getAttr($el, key)) {
      removeAttr($el, key);
    } else {
      setAttr($el, key);
    }
  }

  function query($el, key, callback) {
    return $el.querySelectorAll(key).forEach((el) => callback(el));
  }
  function queryAttr($el, key, callback) {
    return query($el, `[${key}]`, callback);
  }

  function register(name, component) {
    queryAttr(document, name, component);
  }

  function writable(value) {
    let cbs = [];
    let _value = value;
    return {
      subscribe(cb) {
        cb(_value);

        cbs.push(cb);
        return () => {
          cbs = cbs.filter((x) => x !== cb);
        };
      },
      set(val) {
        _value = val;
        cbs.forEach((cb) => cb(_value));
      },
      update(setter) {
        _value = setter(_value);
        cbs.forEach((cb) => cb(_value));
      },
    };
  }

  const header = "u-accordion-header";
  const content = "u-accordion-content";
  const headerOpen = "u-accordion-header-open";
  const contentOpen = "u-accordion-content-open";

  function Accordion($el) {
    queryAttr($el, header, (el) => {
      el.onclick = () => {
        const persistent = getAttr($el, "persistent");
        const id = getAttr(el, "id");

        console.log({ persistent });
        if (!persistent) {
          // remove open attribute
          queryAttr($el, headerOpen, (el) => removeAttr(el, headerOpen));
          queryAttr($el, contentOpen, (el) => removeAttr(el, contentOpen));
        }

        // toggle open of header
        toggleAttr(el, headerOpen);

        // toggle open of related content
        query($el, `[${content}][id="${id}"]`, (el) =>
          toggleAttr(el, contentOpen)
        );
      };
    });
  }

  register("u-accordions", Accordion);

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

  function Bind($el) {
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

  function Icon($el) {
    console.log($el.outerHTML);
    const name = getAttr($el, "name");

    fetch(`https://unpkg.com/@tabler/icons@2.19.0/icons/${name}.svg`)
      .then((res) => res.text())
      .then((svg) => {
        //
        console.log("after fetch", svg);

        const size = attr($el, "u-icon-size");
        $el.outerHTML = svg.replace(
          "<svg xmlns",
          `<svg u-icon u-icon-size="${size}" xmlns`
        );
      });
  }

  register("u-icon", Icon);

  function Modal($el) {
    // close on backdrop click

    queryAttr($el, "u-modal-backdrop", (el) => {
      console.log("add event listener");
      el.onclick = () => {
        Modal.close($el);
      };
    });
    queryAttr($el, "u-modal-content", (el) => {
      console.log("add event listener2");

      // el.onclick = (event) => {
      //   event.stop_propagation();
      // };
    });
  }

  Modal.close = (el) => {
    const persistent = getAttr(el, "persistent");
    if (persistent) return;

    removeAttr(el, "u-modal-open");
  };

  Modal.open = (el) => {
    setAttr(el, "u-modal-open");
  };

  register("u-modal", Modal);

  function Form($el) {
    $el.addEventListener("submit", async (event) => {
      event.preventDefault();

      const entries = new FormData($el);
      const data = Object.fromEntries(entries);

      const url =
        window.location.pathname.substring(
          0,
          window.location.pathname.length - 1
        ) +
        "?" +
        $el.getAttribute("u-action");

      const result = await fetch(url, {
        method: $el.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((res) => res.json());

      alert(result);
    });
    //
  }

  register("u-form", Form);

  exports.Accordion = Accordion;
  exports.Bind = Bind;
  exports.Form = Form;
  exports.Icon = Icon;
  exports.Modal = Modal;

  return exports;

})({});
