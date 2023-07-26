import { View } from "../../components/index.js";

export function Section({ title, description }, ...slots) {
  return View({ mb: "lg" }, [
    title &&
      View(
        {
          tag: "h2",
          mb: "xs",
          scriptProps: "#" + title,
        },
        title
      ),
    description &&
      View(
        { tag: "p", style: "line-height: var(--size-lg);", my: "sm" },
        [description]
      ),
    ...slots,
  ]);
}
