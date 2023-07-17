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
import { Tab } from "./tab";

export * from "./bind";

function ulibsPlugin(Alpine) {
  document.body.setAttribute("u-data", "");

  window.process = {env: {}}

  Popup(Alpine)
  ClientSideRouting(Alpine);
  Checkbox(Alpine);
  Radio(Alpine);
  Select(Alpine);
  Input(Alpine);
  Textarea(Alpine);
  Form(Alpine);
  Accordion(Alpine);
  Icon(Alpine);

  Tab(Alpine);
  AutoComplete(Alpine)
  
  Modal(Alpine);
}

document.addEventListener("DOMContentLoaded", () => {
  Alpine.prefix("u-");
  Alpine.plugin(ulibsPlugin);

  window.Alpine = Alpine;
  Alpine.start();
});
