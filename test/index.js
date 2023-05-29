import { renderScripts, renderTemplate, tag } from "@ulibs/router";
import express from "express";
import connectLivereload from "connect-livereload";
import livereload from "livereload";

import { readFileSync } from "fs";

import page from "./page.js";

function render(component, theme = "dark") {
  const template = renderTemplate(component);
  const script = renderScripts(component);

  console.log(script);
  return renderTemplate(
    tag("html", {}, [
      tag("head", {}, [
        tag("title", {}, "Test Page"),
        tag("link", { rel: "stylesheet", href: "/styles.css" }),
        // title
        // style
      ]),
      tag("body", { class: theme }, [
        template,
        script && tag("script", {}, script),
      ]),
    ])
  );
}

const app = express();

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 10);
});

app.use(connectLivereload());

app.get("/styles.css", (req, res) => {
  const style = readFileSync("./src/styles.css", "utf-8");
  res.send(style);
});

app.get("/:name", (req, res) => {
  res.send(render(page(req.params)));
});

app.listen(3004, () => console.log("URL: http://localhost:3004"));
