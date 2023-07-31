import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default ({ prefix }) =>
  DocPage(
    {
      name: "Installation",
      prefix,
      description: "Description",
    },
    [
      Section({
        title: "",
        descriptions:[
          "To install this library in your nodejs project you can run <pre u-view-border u-view-border-color=\"base-400\" u-view-p='xs' u-view-my='md'><code>npm install @ulibs/ui@next</code></pre>", 
        ]
      }),
      Section({
        title: 'Usage',
        descriptions: [
          "You can import and use components like this: ", "<pre u-view-border u-view-border-color=\"base-400\" u-view-p='xs' u-view-my='md'><code>import { Button } from '@ulibs/ui'\n\nconst str = Button({color: 'primary'}, 'Hello World!')\nconsole.log(str)</code></pre>",
    
        ]
      }),

      Section({
        title: 'Usage with Express',
        descriptions: [
          "To use this library with your expressjs based applications, you can do something like this:",
          `<pre u-view-border u-view-border-color=\"base-400\" u-view-p='xs' u-view-my='md'><code>
import express from 'express'
import {Button, ButtonGroup} from '@ulibs/ui'

const app = express()

app.get('/', (req, res) => {
  const page = ButtonGroup([
    Button({color: 'primary', onClick: "console.log('Hello World!')"}, 'Primary Button'),
    Button("Secondary Button")
  ]);
  const html = page.toHtml()
  res.send(html)
})

app.listen(3000)
</code></pre>`
    
        ],
      }),
      Section({
        title: 'usage with HTML (Not recommended)',
        descriptions: [
          "It is possible to use styles and scripts of components directly without using Component functions, you need to add reference to these files in your html",
          `<pre u-view-border u-view-border-color=\"base-400\" u-view-p='xs' u-view-my='md'><code>
&lt;script src="https://unpkg.com/@ulibs/ui@next/dist/ulibs.js"&gt&lt;/script&gt
&lt;link rel="stylesheet" href="https://unpkg.com/@ulibs/ui@next/dist/styles.css"/&gt
</code></pre><br/>`,
          "Then You can use <code>inspect element</code> feature of your browser in our docs and and copy/paste HTML code of components to your HTML file.",
          `<pre u-view-border u-view-border-color=\"base-400\" u-view-p='xs' u-view-my='md'><code>
&lt;button u-button u-button-color="primary"&gt;Primary Button&lt;/button&gt;
</code></pre>`
        ]
      })
    ]
  );
