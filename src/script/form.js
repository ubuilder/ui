export function Form(Alpine) {
  const handlers = {
    input: (el) => ({
      name: el.name,
      get: () => el.value,
      set: (value) => (el.value = value),
    }),
    checkbox: (el) => {
      const checkbox = el.querySelector("[u-checkbox-input]");

      return {
        name: checkbox.name,
        get: () => checkbox.checked,
        set: (value) => (checkbox.checked = value),
      };
    },
    switch: (el) => {
      const switchEl = el.querySelector("[u-switch-input]");

      return {
        name: switchEl.name,
        get: () => switchEl.checked,
        set: (value) => (switchEl.checked = value),
      };
    },
    "checkbox-group": (el) => {
      // el._model.get
      const name = el.getAttribute("name");

      return {
        name,
        get: () => {
          let value = [];

          el.querySelectorAll("[u-checkbox-group-item-input]").forEach(
            (item) => {
              if (item.checked) {
                value = [...value, item.value];
              }
            }
          );

          return value;
        },
        set(value) {
          console.log("set value of checkbox group to", value);

          el.querySelectorAll("[u-checkbox-group-item-input]").forEach(
            (item) => {
              if (value.includes(item.value)) {
                item.checked = true;
              } else {
                item.checked = false;
              }
            }
          );
        },
      };
    },
    "radio-group": (el) => {
      const name = el.getAttribute("name");

      return {
        name,
        get: () => {
          let value = "";

          el.querySelectorAll("[u-radio-group-item-input]").forEach((item) => {
            if (item.checked) {
              value = item.value;
            }
          });
          return value;
        },
        set: (value) => {
          el.querySelectorAll("[u-radio-group-item-input]").forEach((item) => {
            console.log("radio group", item.value, value);
            if (item.value === value) {
              item.checked = true;
            }
          });
        },
      };
    },
    select: (el) => {
      const name = el.getAttribute("name");
      const multiple = el.getAttribute("multiple");

      return {
        name,
        get() {
          if (multiple) {
            const selected = Array.from(el.selectedOptions)
              .map((option) => option.value)
              .filter((x) => !!x);

            return selected;
          } else {
            const selected = el.selectedOptions[0];

            console.log(selected);
            if (selected) return selected.value;
            return undefined;
          }
        },
        set(value) {
          console.log("set value of select to", value);
          if (Array.isArray(value)) {
            Array.from(el.options).map((option) => {
              if (value.includes(option.value)) option.selected = true;
              else option.selected = false;
            });
          } else {
            el.value = value;
          }
        },
      };
    },
    textarea(el) {
      const name = el.getAttribute("name");

      return {
        name,
        get: () => el.value,
        set: (value) => (el.value = value),
      };
    },
  };

  Alpine.directive("form", (el, {}, {evaluateLater}) => {
    let actionFn;

    let method = el.getAttribute('method')
 
    if(method === 'FUNCTION') {
      actionFn = evaluateLater(el.getAttribute('action'))
      // console.log(actionFn(el, el, value))
      
    }

    const fields = {};

    const formValue = JSON.parse(el.getAttribute("value") ?? "{}");

    for (let input in handlers) {
      el.querySelectorAll(`[u-${input}]`).forEach((el) => {
        const { name, get, set } = handlers[input](el);

        if (typeof formValue[name] !== "undefined") {
          set(formValue[name]);
        }

        fields[name] = { get, set };
      });
    }

    Alpine.bind(el, {
      "u-data"() {
        let result = {};

        for (let field in fields) {
          result[field] = fields[field].get();
        }
        return result;
      },
    });

    Alpine.bind(el, {
      async "u-on:submit"(event) {
        const value = {};
        event.preventDefault();
        
        event.stopPropagation();

        Object.keys(fields).map((key) => {
          value[key] = fields[key].get();
        });

        if (el.getAttribute("method") === "FUNCTION") {          

          const result = await actionFn((v) => v, { scope: { '$value': value }, params: [value] })

        } else {
          const pathname = window.location.pathname;

          const url = pathname.endsWith("/")
            ? pathname.substring(0, pathname.length - 1)
            : pathname + "?" + el.getAttribute("action");

          try {
            const result = await fetch(url, {
              method: "POST", // el.method,
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(value),
            }).then((res) => res.json());

            console.log({ result });
          } catch (err) {
            console.log(err);
          }
        }
      },
    });
  });


  Alpine.magic('post', (el) => {
    return async (pathname, data = {}, headers = {}) => {
      const result = await fetch(pathname, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      }).then(res => res.json())

      return result;
    }
  })

  Alpine.magic('get', (el) => {
    return async (pathname) => {
      const result = await fetch(pathname, {
        method: 'GET',
      }).then(res => res.json())

      return result;
    }
  })
}
