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
import { Tooltip } from "./tooltip";

function components(Alpine) {
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
  AutoComplete(Alpine);
  Modal(Alpine);
  Tabs(Alpine);
  Dropdown(Alpine);
  Tooltip(Alpine);
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
