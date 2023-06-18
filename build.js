import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "fs";
import * as sass from "sass";
import { renderTemplate } from "@ulibs/router";

const files = readdirSync("./src/docs/pages");

if (!existsSync("./build")) {
  mkdirSync("./build");
} else {
  rmSync("./build", { recursive: true });
  mkdirSync("./build");
}

for (let file of files) {
  if (file.endsWith(".js")) {
    import("./src/docs/pages/" + file).then((module) => {
      const page = renderTemplate(module.default());

      if (file == "index.js") {
        writeFileSync("./build/" + "index.html", page);
      } else {
        if (!existsSync("./build/" + file.replace(".js", ""))) {
          mkdirSync("./build/" + file.replace(".js", ""));
        }

        writeFileSync(
          "./build/" + file.replace(".js", "") + "/index.html",
          page
        );
      }
    });
  }
}

const css = sass.compile("./src/styles/index.scss");
writeFileSync("./build/styles.css", css.css);
// cpSync("./src/styles.css", "./build/styles.css");
