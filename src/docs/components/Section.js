import { View } from "../../components/index.js";

export function Section({ title, descriptions = [] }, ...slots) {
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
    descriptions &&
      View(
        { tag: "p", style: "line-height: var(--size-lg);", my: "sm" },
        descriptions
      ),
    ...slots,
  ]);
}
