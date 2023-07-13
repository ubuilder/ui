export function Form(Alpine) {
  const handlers = {
    input: (el) => ({ name: el.name, value: () => el.value }),
    checkbox: (el) => {
      // multiple

      const parent = el.parentElement;

      if (parent.hasAttribute("u-checkbox-group-wrapper")) {
        return;
      } else {
        const checkbox = el.querySelector("[u-checkbox-input]");

        return {
          name: checkbox.name,
          value: () => checkbox.checked,
        };
      }
    },
    "checkbox-group": (el) => {
      // el._model.get
      const name = el.getAttribute("name");

      return {
        name,
        value: () => {
          let value = [];

          el.querySelectorAll("[u-checkbox-input]").forEach((item) => {
            console.log({ item });
            console.log("item ", item.checked, item.value);

            if (item.checked) {
              console.log("item is checked", item.value);
              value = [...value, item.value];
            }
          });
          console.log({ value });
          return value;
        },
      };
    },
    "radio-group": (el) => {
      
      const name = el.getAttribute("name");

      return {
        name,
        value: () => {
          let value = '';

          el.querySelectorAll("[u-radio-input]").forEach((item) => {
            console.log({ item });
            console.log("item ", item.checked, item.value);

            if (item.checked) {
              value = item.value
            }
          });
          console.log({ value });
          return value;
        },
      };
    },
    "select": (el) => {
      const select = el.querySelector('[u-select-input]');

      const name = select.getAttribute('name');
      const multiple = select.getAttribute('multiple');


      return {
        name,
        value() {
          if(multiple) {
            const selected = Array.from(select.selectedOptions).map(option => option.value).filter(x => !!x)

            return selected
          } else {
            const selected = select.selectedOptions[0].value

            return selected; 
          }
        }        
      }
    },
    'textarea'(el) {
      const textarea = el.querySelector('[u-textarea-input]');

      const name = textarea.getAttribute('name')

      return {
        name,
        value: () => textarea.value
      }
    }
  };

  Alpine.directive("form", (el) => {
    const fields = {};

    let inputs = ["input", "checkbox", "checkbox-group", 'radio-group', 'select', 'textarea'];

    for (let input of inputs) {
      el.querySelectorAll(`[u-${input}]`).forEach((el) => {
        const { name, value } = handlers[input](el);

        fields[name] = value;
      });
    }

    Alpine.bind(el, {
      "u-data"() {
        let result = {};

        for (let field in fields) {
          result[field] = fields[field]();
        }
        return result;
      },
    });

    Alpine.bind(el, {
      async "u-on:submit"(event) {
        const value = {};
        event.preventDefault();

        Object.keys(fields).map((key) => {
          console.log(key, "fields: ", fields);
          value[key] = fields[key]();
        });

        const pathname = window.location.pathname;

        const url = pathname.endsWith("/")
          ? pathname.substring(0, pathname.length - 1)
          : pathname + "?" + el.getAttribute("action");

        try {
          // support function call
          console.log("function call");
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
      },
    });
  });
}

/** export function Form($el) {
  $el.addEventListener("submit", async (event) => {
    event.preventDefault();

    const entries = new FormData($el);
    const data = Object.fromEntries(entries);

    const pathname = window.location.pathname;

    // Checkbox Group
    $el.querySelectorAll("[multiple]").forEach((el) => {
      console.log(el);
      data[el.getAttribute("name")] = entries.getAll(el.getAttribute("name"));
    });

    const url = pathname.endsWith("/")
      ? pathname.substring(0, pathname.length - 1)
      : pathname + "?" + $el.getAttribute("u-action");

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
*/
