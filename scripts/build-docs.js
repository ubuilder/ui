import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "fs";
import { View } from "../src/components/View.js";

const files = readdirSync("./src/docs/pages");

if (!existsSync("./build/ui")) {
  mkdirSync("./build/ui", { recursive: true });
} else {
  rmSync("./build/ui", { recursive: true });
  mkdirSync("./build/ui");
}

function layout(props, slots) {
  // const script = readFileSync("./dist/ulibs.js", "utf-8");
  // const style = readFileSync("./dist/styles.css", "utf-8");

  return View(
    {
      htmlHead: [
        `<link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet">`,
                
        View({ tag: "link", rel: 'stylesheet', href: '/ui/styles.css' }),
        View({ tag: "script", src: '/ui/ulibs.js', defer: true, async: true }),
      ],
    },
    slots
  );
}

for (let file of files) {
  if (file.endsWith(".js")) {
    import("../src/docs/pages/" + file).then((module) => {
      const page = layout({}, module.default({ prefix: "/ui/" })).toHtml();

      if(!page) return;
      if (file == "index.js") {
        writeFileSync("./build/ui/" + "index.html", page);
      } else {
        if (!existsSync("./build/ui/" + file.replace(".js", ""))) {
          mkdirSync("./build/ui/" + file.replace(".js", ""));
        }

        writeFileSync(
          "./build/ui/" + file.replace(".js", "") + "/index.html",
          page
        );
      }
    });
  }
}

cpSync("./dist/ulibs.js", "./build/ui/ulibs.js");
cpSync("./dist/styles.css", "./build/ui/styles.css");
