import {
  View,
  Tabs,
  TabsPanel,
  TabsList,
  TabsContent,
  TabsItem,
} from "../../components/index.js";
import { Base } from "../../utils.js";

import * as components from '../../components/index.js'

let id = 0;

export const Preview = Base({
  render($props, $slots) {
    id++;
    const code = $props.code;
    const prefix = $props.prefix ?? '/ui/';
    const height = $props.height;
    
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


    const script = `
    import {${Object.keys(components).filter(key => `View ${code}`.indexOf(key) > -1).join(', ')}} from '${prefix}src/components/index.js'

    const page = View({d: 'inline-flex', p: 'sm', gap: 'xs'},[${code.trim()}])

    document.getElementById("preview-html-${id}").innerHTML = page.toString()
    document.getElementById("preview-code-${id}").innerHTML = page.toString().replace(/</g, "\\n&#60;").replace(/>/g, "&#62;\\n\\t").replace(/\\n/g, '<br/>')
`
    

    return Tabs(
      {
        htmlHead: [
          View({type: 'module', tag: 'script'}, script)
        ],
     
      },
      [
        TabsList([TabsItem("Preview"), TabsItem("HTML"), TabsItem("JS")]),
        TabsContent([
          TabsPanel(
            { style: `position: relative; padding: 0; min-height: 100px; height: ${height}px` },
            [
              View({id: 'preview-html-' + id}),
            ]
          ),
          TabsPanel([
            View(
              {
                tag: "pre",
                style:
                  "font-size: var(--size-xs); line-height: var(--size-sm); overflow: auto",
              },
              [
                View({ tag: "code", id: "preview-code-" + id })
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
