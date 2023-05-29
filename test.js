import { renderTemplate, html, tag, renderScripts } from "@ulibs/router";
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  Accordions,
} from "./src/Accordion.js";
import { Button } from "./src/Button.js";
import { View } from "./src/View.js";

function test() {
  const result = View({ p: "sm" }, [
    Accordions({}, [
      Accordion({
        body: "Accordion body",
        header: "AccordionHeader",
      }),
      Accordion({
        body: "Accordion body",
        header: "AccordionHeader",
      }),
      Accordion({
        body: "Accordion body",
        header: "AccordionHeader",
      }),
    ]),
    Accordions({ mt: "sm" }, [
      Accordion({
        body: "Accordion body",
        header: "AccordionHeader",
      }),
      Accordion({
        body: "Accordion body",
        header: "AccordionHeader",
      }),
      Accordion({
        body: "Accordion body",
        header: "AccordionHeader",
      }),
    ]),
  ]);

  const template = renderTemplate(result);
  const script = renderScripts(result);

  console.log(
    renderTemplate(
      html({
        head: [],
        body: [template, script && tag("script", {}, script)],
      })
    )
  );
}

test();
