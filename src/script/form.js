import { register } from "./helpers";

export function Form($el) {
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
