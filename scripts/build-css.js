import {
    existsSync,
    mkdirSync,
    writeFileSync,
  } from "fs";

import * as sass from "sass";


const css = sass.compile("./src/styles/index.scss");

if (!existsSync("./dist")) {
  mkdirSync("./dist");
}

writeFileSync("./dist/styles.css", css.css);

console.log('created ', "./dist/styles.css")