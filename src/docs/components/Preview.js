import {
  View,
  Tabs,
  TabsPanel,
  TabsList,
  TabsContent,
  TabsItem,
  Icon,
  Spinner,
} from "../../components/index.js";
import { Base } from "../../utils.js";

import * as components from '../../components/index.js'

let id = 0;

export const Preview = Base({
  render($props, $slots) {
    id++;
    const code = $props.code;
    const theme = "dark";
    function indent(level) {
      return Array.from({ length: level + 1 }).join("  ");
    }

    function getSlots(slots, level) {
      return getHTMLCode(slots, level);
    }

    function getAttributes(obj) {
      let result = "";
      for (let key in obj) {
        if (obj[key] === "" || obj[key] === true) {
          result += " " + key;
        } else {
          result += " " + key + "=" + '"' + obj[key] + '"';
        }
      }
      return result;
    }

    function getHTMLCode(json, level = 0) {
      if (Array.isArray(json)) {
        return json.map((item) => getHTMLCode(item, level)).join("");
      }

      if (typeof json === "string") return indent(level) + json + "\n";

      if (!json) return "";

      let selfClosing = false;
      if (json.tag === "img") selfClosing = true;
      if (json.slots.toString() === "") selfClosing = true;

      return (
        indent(level) +
        `&#60${json.tag}${getAttributes(json.props)}${
          selfClosing ? " /" : ""
        }&#62;\n${selfClosing ? "" : getSlots(json.slots, level + 1)}${
          selfClosing ? "" : indent(level)
        }${selfClosing ? "" : "&#60;/"}${selfClosing ? "" : json.tag}${
          selfClosing ? "" : "&#62;\n"
        }`
      );
    }

    const html_string =
      `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/@ulibs/ui@next/dist/styles.css">                                            
    <script src="https://unpkg.com/@ulibs/ui@next/dist/ulibs.js"></scr` +
      `ipt>                                            
    <style>
    body {
        background-color: transparent;
        color: inherit;
    }
    </style>
    <script type="module">
        import {${Object.keys(components).filter(key => `View ${code}`.indexOf(key) > -1).join(', ')}} from 'https://unpkg.com/@ulibs/ui@next/src/components/index.js'

        const page = View({d: 'inline-flex', p: 'sm', gap: 'xs'},${code.trim()})

        document.body.innerHTML = page.toString()
        window.parent.postMessage({type: 'code', id: '${id}', page: page.toString()}, "*")
        console.log('postMessage', {type: 'code', id: '${id}', page: page.toString()})

    </scr` +
      `ipt>
    <title>Document</title>
</head>
<bo` +
      `dy></bo` +
      `dy></ht` +
      `ml>`;

    const src = "data:text/html;charset=utf-8," + escape(html_string);

    const iframe = View({
      tag: "iframe",
      id: "preview-iframe-" + id,
      w: 100,
      frameborder: 0,
      src,
    });

    return Tabs(
      {
        script: `
        
        window.addEventListener('message', event => {
          function removeSpinner(id) {
            document.querySelector("#preview-spinner-" + id).style.display = 'none'
            
        }
          if (event.data.type === 'code') { 
              
              document.querySelector('#preview-code-' + event.data.id).innerHTML = event
                .data.page.toString().replace(/</g, "\\n&#60;").replace(/>/g, "&#62;\\n\\t").replace(/\\n/g, '<br/>')

            removeSpinner(event.data.id)
            } else {
              // The data was NOT sent from your site!
              return;
            }
          });`,
      },
      [
        TabsList([TabsItem("Preview"), TabsItem("HTML"), TabsItem("JS")]),
        TabsContent([
          TabsPanel(
            { style: "position: relative; padding: 0; min-height: 100px; max-height: 600px" },
            [
              View(
                {
                    
                  id: "preview-spinner-" + id,
                  d: "flex",
                  style: "position: absolute; top: 0; left: 0; bottom: 0; right: 0",
                  align: "center",
                  justify: "center",
                },
                Spinner({ color: "primary", size: "lg" })
              ),
              iframe,
            ]
          ),
          // TabsPanel([View($props, $slots)]),
          TabsPanel([
            View(
              {
                tag: "pre",
                style:
                  "font-size: var(--size-xs); line-height: var(--size-sm); overflow: auto",
              },
              [
                View({ tag: "code", id: "preview-code-" + id }, [
                  // getHTMLCode(code)
                  //   $slots
                  //     .join("\n")
                  //     .replace(/</g, "\n&#60;")
                  //     .replace(/>/g, "&#62;\n\t"),
                ]),
              ]
            ),
          ]),
          $props.code &&
            TabsPanel([
              View(
                {
                  tag: "pre",
                  style:
                    "font-size: var(--size-xs); line-height: var(--size-sm); overflow: auto",
                },
                [View({ tag: "code" }, [$props.code])]
              ),
            ]),
        ]),
      ]
    );
  },
});
