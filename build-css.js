import {
    existsSync,
    mkdirSync,
    writeFileSync,
  } from "fs";

import * as sass from "sass";


const css = sass.compile("./src/styles/index.scss");
writeFileSync("./build/styles.css", css.css);

if (!existsSync("./dist")) {
  mkdirSync("./dist");
}

writeFileSync("./dist/styles.css", css.css);
