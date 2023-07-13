import { Base, classname } from "../utils.js";
import { FormField } from './FormField.js';
import { Row } from "./GridSystem.js";
import { View } from "./View.js";

/**
* @type {import('.').Form}
*/
export const Form = Base(($props, $slots) => {
  $props.tag = "form";
  // $props.component = $props.component ?? "form";
  $props.method = $props.method ?? "POST";
  $props[classname("action")] = $props.action ?? "POST";
  $props[classname('form')] = true;

  return Row($props, $slots);
});

/**
* @type {import('.').FileUpload}
*/
export const FileUpload = Base(($props, $slots) => {
  // file upload
});

/**
* @type {import('.').Editor}
*/
export const Editor = Base(($props, $slots) => {
  // Editor component
});

/**
* @type {import('.').Autocomplete}
*/
export const Autocomplete = Base(($props, $slots) => {
  // Autocomplete
});

/**
* @type {import('.').Datepicker}
*/
export const Datepicker = Base(($props, $slots) => {
  // Datepicker
});

/**
* @type {import('.').Switch}
*/
export const Switch = Base(($props, $slots) => {
  // Switch component
});

/**
* @type {import('.').Slider}
*/
export const Slider = Base(($props, $slots) => {
  // Slider
});
