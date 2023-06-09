import express from "express";

const app = express();

app.get("/styles.css", (req, res) => {
  const file = fs.readFileSync('./src/styles.css')
  res.sendFile(file);
});

app.get("/ulibs.js", (req, res) => {
  const file = fs.readFileSync('./build/ulibs.js')
  res.sendFile(file);
});
app.use("/components", express.static("./build"));

app.get("/", (req, res) => {
  res.redirect("/components");
});

app.listen(3002, () => {
  console.log("listening on port " + 3002);
});
