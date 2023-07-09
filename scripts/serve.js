import { Router } from "@ulibs/router";
import {  View } from "../index.js";
import fs from "fs";

const router = Router({ dev: true, reloadTimeout: 1000 });

function layout(props, slots) {
  const script = fs.readFileSync("./dist/ulibs.js", "utf-8");
  const style = fs.readFileSync("./dist/styles.css", "utf-8");

  return View(
    {
      htmlHead: [
        View({ tag: "title" }, "Hello World 2"),
        View({ tag: "style" }, style),
        View({ tag: "script", defer: true, async: true }, script),
      ],
      test: true,
    },
    slots
  );
}

const prefix = "/components/";

router.addPage('/', {
  async load() {
    console.log('load')
      const result = await import("../src/docs/pages/index.js")
        console.log(result, prefix)
      return {
        component: result.default,
        prefix,
      };
    
  },
  page: ({component, ...props}) => {
    console.log({component, props})
    if(!component) return;
    return component(props)
    
  }

});

function Page404() {
  return View({}, "404 Page not found");
}

router.addPage(prefix + ":component", {
  async load({ params }) {
    try {
      if (params.component === "ulibs.js") return;
      if (params.component === "styles.css") return;
      if (params.component === "index.js") return;
      const result = await import(
        "../src/docs/pages/" + params.component + ".js"
      );

      return {
        component: result.default,
      };
    } catch (err) {
      console.log("err: ", err);
      return {
        component: () => Page404(),
      };
    }
  },
  page: ({ component, ...props }) => {
    if (!component) return;
    return component({ ...props });
  },
});

router.addLayout('/', {
  load() {
    return { prefix };
  },
  component: layout,
});

router.startServer(3002);
