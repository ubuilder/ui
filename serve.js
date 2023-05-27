import express from "express";

const app = express();

app.get("/styles.css", (req, res) => {
  res.sendFile("/home/hadi/git/ulibs/components/src/styles.css");
});
app.use("/components", express.static("./build"));

app.get("/", (req, res) => {
  res.redirect("/components");
});

app.listen(3002, () => {
  console.log("listening on port " + 3002);
});
