import { Router } from "@ulibs/router";
import { View } from "../src/components/index.js";
import fs from "fs";

const router = Router({ dev: true, reloadTimeout: 1500 });

const prefix = "/ui/";

const host = "localhost";

router.addStatic({ path: "./dist", prefix: prefix + "dist" });
router.addStatic({ path: "./src", prefix: prefix + "src" });

function layout(props, slots) {
  return View(
    {
      htmlHead: [
        View({
          tag: "link",
          rel: "stylesheet",
          href: prefix + "dist/styles.css",
        }),
        View({ tag: "script", defer: true, src: prefix + "dist/ulibs.js" }),
        View({
          tag: "meta",
          name: "viewport",
          content: "width=device-width, initial-scale=1.0",
        }),
      ],
    },
    slots
  );
}

const files = fs.readdirSync("./src/docs/pages");

await Promise.all(
  files.map(async (file) => {
    let slug = file.replace(".js", "");

    if (file === "index.js") {
      slug = "";
    }

    // console.log({file, slug})
    const result = await import("../src/docs/pages/" + file);

    // console.log('addPage', prefix + slug)
    router.addPage(prefix + slug, {
      load(req) {
        // console.log(req)
      },
      page: ({ ...props }) => {
        return result.default({ ...props });
      },
    });
  })
);

router.addLayout(prefix, {
  load() {
    console.log("layout load", prefix);
    return { host, prefix, theme: "dark" };
  },
  component: layout,
});

const args = process.argv;

if (args.includes("dev")) {
  const portIndex = args.findIndex((x) => x === "--port");
  if (portIndex > 0) {
    const port = args[portIndex + 1] ?? 3002;
    router.startServer(port);
  } else {
    router.startServer(3002);
  }
} else if (args.includes("build")) {
  const path = "./build";

  router.build(path);
} else if (args.includes("start")) {
  const portIndex = args.findIndex((x) => x === "--port");
  if (portIndex > 0) {
    const port = args[portIndex + 1] ?? 3002;
    router.startServer(port);
  } else {
    router.startServer(3002);
  }
}
