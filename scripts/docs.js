import { Router } from "@ulibs/router";
import { View } from "../src/components/index.js";
import { DocPage, Preview, Section } from "../src/docs/components/index.js";

import fs from "fs";
import { readMarkdownDoc } from "./mark.js";
import path from "path";

const router = Router({ dev: true, reloadTimeout: 1500 });

const prefix = "/ui/";

const host = "localhost";

router.addStatic({ path: "./dist", prefix: prefix + "dist" });
router.addStatic({ path: "./src", prefix: prefix + "src" });

function Doc({ title, description, sections }) {
  return DocPage(
    { name: title, description },
    sections.map((section) => {
      return Section(
        {
          title: section.find((x) => x.type === "title")?.value ?? "No Title",
          descriptions: section
            .filter((sec) => sec.type === "description")
            .map((x) => x.value),
        },
        section
          .filter((sec) => sec.type === "code")
          .map((x) => Preview({ code: x.value, static: x.meta === "static" }))
      );
    })
  );
}

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
    let slug = file;

    if (file.endsWith(".md")) {
      slug = slug.replace(".md", "");
    }

    if (file.endsWith(".js")) {
      slug = slug.replace(".js", "");
    }

    if (file === "index.js") {
      slug = "";
    }

    if (file.endsWith(".js")) {
      // console.log({file, slug})
      const result = await import("../src/docs/pages/" + file);

      if (Array.isArray(result.default)) {
        const { default: sections, title, description } = result;

        router.addPage(prefix + slug, {
          page: ({ ...props }) => {
            return Doc({ title, description, sections });
          },
        });
      } else {
        router.addPage(prefix + slug, {
          page: ({ ...props }) => {
            return result.default({ ...props });
          },
        });
      }
    } else {
      // markdown
      const result = await readMarkdownDoc("./src/docs/pages/" + file);
      router.addPage(prefix + slug, {
        page({ ...props }) {
          return Doc(result);
        },
      });
    }
  })
);

router.addLayout(prefix, {
  load() {
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
