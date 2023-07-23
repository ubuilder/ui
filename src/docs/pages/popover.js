import { Button } from "../../components/Button.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Popover} from "../../components/index.js";
import { Preview } from '../components/Preview.js'

export default function () {
  return DocPage({ name: "Tabs" }, [
    Section(
      {
        title: "popover",
        description: "the default values acts like this",
      },
      [
        Preview({
          code: `Button(["click me", Popover("Hi, it is popover")])]`,
        }),
      ]
    ),
    Section(
      {
        title: "popover",
        description: "the default active tabs is tabs one if not specified",
      },
      [
        Preview({
          code: `Button(["hover me", Popover({trigger: 'hover'},"Hi, it is popover")])]`,
        }),
      ]
    ),
    Section(
      {
        title: "popover",
        description: "the default active tabs is tabs one if not specified",
      },
      [
        Preview({
          code: `Button(["hover, none-persistant", Popover({trigger: 'hover',persistant: 'false' },"Hi, it is popover")])]`,
        }),
      ]
    ),
    Section(
      {
        title: "popover",
        description: "the default active tabs is tabs one if not specified",
      },
      [
        Preview({
          code: `Button(["hover, none-persistant, arrow", Popover({trigger: 'hover',persistant: 'false', arrow: 'true' },"Hi, it is popover")])]`,
        }),
      ]
    ),
    Section(
      {
        title: "popover",
        description: "the default active tabs is tabs one if not specified",
      },
      [
        Preview({
          code: `
          Button(["hover, persistant, arrow, top", Popover({trigger: 'hover',persistant: 'true', arrow: 'true', placement: 'top' },"Hi, it is popover")])],
          Button(["hover, persistant, arrow, left", Popover({trigger: 'hover',persistant: 'true', arrow: 'true', placement: 'left' },"Hi, it is popover")])],
          Button(["hover, persistant, arrow, bottom", Popover({trigger: 'hover',persistant: 'true', arrow: 'true', placement: 'bottom' },"Hi, it is popover")])],
          Button(["hover, persistant, arrow, right", Popover({trigger: 'hover',persistant: 'true', arrow: 'true', placement: 'right' },"Hi, it is popover")])],
          `,
        }),
      ]
    ),
    Section(
      {
        title: "popover",
        description: "the default active tabs is tabs one if not specified",
      },
      [
        Preview({
          code: `
          Button(["hover, persistant", Popover({trigger: 'hover',persistant: 'true',},[
            Button(["hover, persistant", Popover({trigger: 'hover',persistant: 'true',},'popover')]),
            Button(["hover, none-persistant", Popover({trigger: 'hover',persistant: 'false',},'popover')]),
          ])])],
          `,
        }),
      ]
    ),



    Section(
      {
        title: "popover",
        description: "the default active tabs is tabs one if not specified",
      },
      [Button(["arrow, click", Popover({arrow: true, trigger: 'click'},"popover")])]
    ),
    Section(
      {
        title: "tabs",
        description: "the default active tabs is tabs one if not specified",
      },
      [Button(["focusable, hover", Popover({trigger: 'hover', focusAble: true},["popover"])])]
    ),
    Section(
      {
        title: "tabs",
        description: "the default active tabs is tabs one if not specified",
      },
      [Button(["focusable, hover, arrow", Popover({trigger: 'hover', arrow: true, persistant: true},["popover"])])]
    ),
    Section(
      {
        title: "tabs",
        description: "the default active tabs is tabs one if not specified",
      },
      [Button(["not persistant, hover, arrow", Popover({trigger: 'hover', arrow: true, persistant: false},["popover"])])]
    ),
    Section(
      {
        title: "tabs",
        description: "the default active tabs is tabs one if not specified",
      },
      [Button(["focusable, click, arrow", Popover({trigger: 'click', arrow: true, focusAble: true},["popover"])])]
    ),
    Section(
      {
        title: "tabs",
        description: "the default active tabs is tabs one if not specified",
      },
      [Button(["i am popover", Popover({arrow: true},["popover"])])]
    ),
    Section(
      {
        title: "tabs",
        description: "the default active tabs is tabs one if not specified",
      },
      [Button(["placement left", Popover({arrow: 'true', placement: 'left'},["popover"])])]
    ),
    Section(
      {
        title: "tabs",
        description: "the default active tabs is tabs one if not specified",
      },
      [Button(["placemenet right", Popover({arrow: true, placement: 'right'},["popover"])])]
    ),
    Section(
      {
        title: "tabs",
        description: "the default active tabs is tabs one if not specified",
      },
      [Button(["placemnt top", Popover({arrow: true, placement: 'top'},["popover"])])]
    ),
  ]);
}
