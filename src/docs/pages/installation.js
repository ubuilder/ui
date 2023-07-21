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
        description:
          "To install this library in your nodejs project you can run <pre u-view-border u-view-p='xs' u-view-my='md'><code>npm install @ulibs/ui@next</code></pre> then use components like this: <pre u-view-border u-view-p='xs' u-view-my='md'><code>import { Button } from '@ulibs/ui'\n\nconst str = Button({color: 'primary'}, 'Hello World!')\nconsole.log(str)</code></pre> TODO complete installation guide",
      }),
    ]
  );
