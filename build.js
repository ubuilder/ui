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
import {View} from './index.js'

const files = readdirSync("./src/docs/pages");

if (!existsSync("./build/components")) {
  mkdirSync("./build/components", {recursive: true});
} else {
  rmSync("./build/components", { recursive: true });
  mkdirSync("./build/components");
}


function layout(props, slots) {
  const script = readFileSync('./dist/ulibs.js', 'utf-8');
  const style = readFileSync('./dist/styles.css', 'utf-8');

  console.log({script, style})
  return View({
    htmlHead: [
      View({tag: 'title'}, 'Hello World 2'),
      View({tag: 'style'}, style),
      View({tag: 'script', defer: true, async: true}, script),
    ],
    test: true
    
  }, slots)
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
