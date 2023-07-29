// import { renderHead, renderScripts, renderTemplate } from "./index.js";
import { renderHead, renderTemplate } from "./template.js";
import { renderScripts } from "./scripts.js";
export function tag(tagName, props = {}, ...slots) {

  if(typeof tagName === 'object') {
    return tag(tagName.tag, tagName.props, tagName.slots)
  }
  
  return {
    tag: tagName,
    props,
    slots,
    toString() {
      return renderTemplate(this);
    },
    toHead() {
      return renderHead(this);
    },
    toScript() {
      return renderScripts(this);
    },
    toHtml() {
      return `<!DOCTYPE html>
<html>
  <head>
    ${this.toHead()}
  </head>
  <body>
    ${this.toString()}
    <script>
      ${this.toScript()}
    </script>
  </body>
</html>`
    }
  };
}

export function html({ head, body } = {}) {
  return tag("html", {}, [
    head && tag("head", {}, head),
    tag("body", {}, body),
  ]);
}
