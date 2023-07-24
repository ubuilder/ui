import Alpine from "alpinejs";

import { Accordion } from "./accordion";
import { Icon } from "./icon";
import { Form } from "./form";
import { AutoComplete } from "./autoComplete";
import { Modal } from "./modal";
import { ClientSideRouting } from "./routing";
import { Popup } from "./popup";
import { Checkbox } from "./checkbox";
import { Radio } from "./radio";
import { Input } from "./input";
import { Select } from "./select";
import { Textarea } from "./textarea";
import { Tabs } from "./tabs";
import { Dropdown } from "./dropdown";
import { CodeEditor } from './code-editor';
import { Tooltip } from "./tooltip";
import { Popover } from "./popover";
import { Alert } from "./alert";

// import hljs from 'highlight.js/lib/core';
// import javascript from 'highlight.js/lib/languages/javascript';
// hljs.registerLanguage('javascript', javascript);

function components(Alpine) {

  // Alpine.directive('code-viewer', (el) => {
  //   const prism = hljs.highlightElement(el, true, (result) => {
  //     console.log(result)
  //   })
  //   console.log(prism)
  // })
  
  Alert(Alpine)
  Popup(Alpine);
  ClientSideRouting(Alpine);
  Checkbox(Alpine);
  Radio(Alpine);
  Select(Alpine);
  Input(Alpine);
  Textarea(Alpine);
  Form(Alpine);
  Accordion(Alpine);
  Icon(Alpine);
  CodeEditor(Alpine);
  AutoComplete(Alpine)
  Modal(Alpine);
  Tabs(Alpine);
  Dropdown(Alpine);
  Tooltip(Alpine);
  Popover(Alpine);
}

document.addEventListener("DOMContentLoaded", () => {
  if(!document.body.hasAttribute('u-data')) {
    document.body.setAttribute("u-data", "");
  }
  
  Alpine.prefix("u-");
  Alpine.plugin(components);

  window.Alpine = Alpine;
  Alpine.start();
});
