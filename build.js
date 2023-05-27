import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { renderTemplate } from "@ulibs/router";

const files = readdirSync("./docs/pages");

if (!existsSync("./build")) {
  mkdirSync("./build");
} else {
  rmSync("./build", { recursive: true });
  mkdirSync("./build");
}

for (let file of files) {
  if (file.endsWith(".js")) {
    import("./docs/pages/" + file).then((module) => {
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
