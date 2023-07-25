import { Base, classname } from "../utils.js";
import { Row } from "./GridSystem.js";

export const Form = Base({
  render($props, $slots) {
    $props.tag = "form";

    $props.method = $props.method ?? "POST";
    $props[classname("form")] = true;

    return Row($props, $slots);
  },
});

export const FileUpload = Base({
  render($props, $slots) {
    // file upload
  },
});

export const Editor = Base({
  render($props, $slots) {
    // Editor component
  },
});

export const Datepicker = Base({
  render($props, $slots) {
    // Datepicker
  },
});

export const Slider = Base({
  render($props, $slots) {
    // Slider
  },
});
