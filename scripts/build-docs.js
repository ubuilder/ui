import {
    cpSync,
    existsSync,
    readFileSync,
    mkdirSync,
    readdirSync,
    rmSync,
    writeFileSync,
  } from "fs";
  import { renderTemplate } from "@ulibs/router";

  
  const files = readdirSync("./src/docs/pages");
  
  if (!existsSync("./build/components")) {
    mkdirSync("./build/components", {recursive: true});
  } else {
    rmSync("./build/components", { recursive: true });
    mkdirSync("./build/components");
  }
    
  for (let file of files) {
    if (file.endsWith(".js")) {
      import("./src/docs/pages/" + file).then((module) => {
        const page = renderTemplate(module.default({prefix: '/components/'}));
  
        if (file == "index.js") {
          writeFileSync("./build/components/" + "index.html", page);
        } else {
          if (!existsSync("./build/components/" + file.replace(".js", ""))) {
            mkdirSync("./build/components/" + file.replace(".js", ""));
          }
  
          writeFileSync(
            "./build/components/" + file.replace(".js", "") + "/index.html",
            page
          );
        }
      });
    }
  }
  
  cpSync("./dist/ulibs.js", "./build/components/ulibs.js");
  cpSync("./dist/styles.css", "./build/components/styles.css");
  