import { register } from "./helpers";

export function Form($el) {
  $el.addEventListener("submit", async (event) => {
    event.preventDefault();

    const entries = new FormData($el);
    const data = Object.fromEntries(entries);

    const pathname = window.location.pathname.endsWith('/') ? window.location.pathname.substring(
      0,
      window.location.pathname.length - 1
    ) : window.location.pathname
    
    const url =pathname +
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
