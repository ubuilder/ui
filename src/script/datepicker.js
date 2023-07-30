import Pikaday from "pikaday";

//bine editor to textarea
export function Datepicker(Alpine) {
  Alpine.directive("datepicker", (el) => {
    var picker = new Pikaday({
      field: el,
      format: "D MMM YYYY",
      onSelect: function () {
        console.log(this.getMoment().format("Do MMMM YYYY"));
      },
    });
    console.log('datepicker', picker)

    // const placeholder = textarea.getAttribute("placeholder");
    // const readOnly = el.hasAttribute("u-textarea-readonly");
    // const disabled = textarea.hasAttribute("disabled");
    // const value = textarea.getAttribute("value");
    // const toolbar = el.getAttribute("u-texteditor-toolbare");
    // const type = el.getAttribute("u-texteditor-type");
    // const model = el.getAttribute("u-texteditor-model");

    // if (value) quill.root.innerHTML = value;

    // if (textarea.form) {
    //   textarea.form.addEventListener("reset", () => {
    //     textarea.value = "";
    //     textarea.dispatchEvent(new Event("input"));
    //   });
    // }

    // Alpine.bind(textarea, () => ({
    //   "u-model": model ? model : textareaName,
    //   "u-on:input"() {
    //     if (textarea.value !== quill.root.innerHTML || textarea.value === "") {
    //       quill.root.innerHTML = textarea.value;
    //     }
    //   },
    // }));

    // Alpine.bind(el, () => ({
    //   "u-effect"() {
    //     // listening for $data changes
    //     if (textareaName && this[textareaName] !== quill.root.innerHTML) {
    //       quill.root.innerHTML = textarea.value ? textarea.value : "";
    //     }
    //     //listening for $model changed
    //     if (model && this[model] !== quill.root.innerHTML) {
    //       quill.root.innerHTML = this[model] ? this[model] : "";
    //     }
    //   },
    // }));
  });
}
