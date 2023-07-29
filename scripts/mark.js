import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

import { readFileSync } from "fs";

export async function readMarkdownDoc(path) {
  let docs = { sections: [] };

  let myResult = unified().use(remarkParse).parse(readFileSync(path, "utf-8"));

  //

  let activeSection = null;
  for (let child of myResult.children) {
    if (child.type === "heading") {
      if (child.depth === 1) docs.title = child.children[0].value;

      if (child.depth === 2) {
        if (activeSection?.length > 0) {
          docs.sections.push(activeSection);
        }

        activeSection = [];

        activeSection.push({ type: "title", value: child.children[0].value });

        // const coe
        // docs.sections.push =
      }
    }

    if (activeSection) {
      if (child.type === "paragraph") {
        const file = readFileSync(path, "utf-8");
        const str = file.substring(
          child.position.start.offset,
          child.position.end.offset
        );

        await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkRehype)
          .use(rehypeStringify)
          .process(str)
          .then((result) => {
            activeSection.push({
              type: "description",
              value: result.value.replace(/^\<p\>/, "").replace(/\<\/p\>$/, ""),
            });
          });
      }

      if (child.type === "code") {
        if (child.value.endsWith(";"))
          child.value = child.value.substring(0, child.value.length - 1);

        activeSection.push({
          type: "code",
          value: child.value,
          meta: child.meta,
        });
      }
    } else {
      if (child.type === "paragraph") {
        const file = readFileSync(path, "utf-8");
        const str = file.substring(
          child.position.start.offset,
          child.position.end.offset
        );

        await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkRehype)
          .use(rehypeStringify)
          .process(str)
          .then((result) => {
            docs.description = result.value
              .replace(/^\<p\>/, "")
              .replace(/\<\/p\>$/, "");
          });
      }
    }
  }
  if (activeSection && activeSection.length > 0) docs.sections.push(activeSection);

  return docs;
}
// const result = await readMarkdownDoc("./src/docs/pages/alert.md");

// console.log(result)
