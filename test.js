import { renderScripts, renderTemplate, html, tag } from "@ulibs/router";
import { Button } from "./src/Button.js";

function test() {
  const result = Button(
    {
      onMount($el) {
        console.log("button mounted", $el);
      },
      onClick() {
        console.log(this, "Hello");
      },
      onMouseOver() {
        console.log(this, 'mouse over')
      }
    },
    "Hello"
  );

  const template = renderTemplate(result);
  const script = renderScripts(result);

  console.log(renderTemplate(html({
    head: [],
    body: [template, script && tag('script', {}, script)]
  })))
}

test();
