import { Router } from "@ulibs/router";
import {  View } from "../src/components/index.js";
import fs from "fs";

const router = Router({ dev: true, reloadTimeout: 1500 });

function layout(props, slots) {
  const script = fs.readFileSync("./dist/ulibs.js", "utf-8");
  const style = fs.readFileSync("./dist/styles.css", "utf-8");

  return View(
    {
      htmlHead: [
        View({ tag: "style" }, style),
        View({ tag: "script", defer: true, async: true }, script),
      ],
    },
    slots
  );
}

const prefix = "/components/";

router.addPage('/', {
  async load() {
      const result = await import("../src/docs/pages/index.js")
      return {
        component: result.default,
        prefix,
      };
    
  },
  page: ({component, ...props}) => {
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
        component: (...args) => View({'u-routing': true}, result.default(...args)),
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
