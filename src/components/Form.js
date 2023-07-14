import { Base, classname } from "../utils.js";
import { FormField } from './FormField.js';
import { Row } from "./GridSystem.js";
import { View } from "./View.js";

/**
* 
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
* 
*/
export const FileUpload = Base(($props, $slots) => {
  // file upload
});

/**
* 
*/
export const Editor = Base(($props, $slots) => {
  // Editor component
});

/**
* 
*/
export const Autocomplete = Base(($props, $slots) => {
  // Autocomplete
});

/**
* 
*/
export const Datepicker = Base(($props, $slots) => {
  // Datepicker
});

/**
* 
*/
export const Switch = Base(($props, $slots) => {
  // Switch component
});

/**
* 
*/
export const Slider = Base(($props, $slots) => {
  // Slider
});
