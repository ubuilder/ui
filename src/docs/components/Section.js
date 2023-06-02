import { View } from "../../components/index.js";

export function Section(
  { component = "section", title, description },
  ...slots
) {
  return View({ component, mb: "md" }, [
    title &&
      View(
        {
          tag: "h2",
          component: component + "-title",
          mb: "xs",
          scriptProps: "#" + title,
        },
        title
      ),
    description &&
      View({ tag: "p", component: component + "-description" }, description),
    ...slots,
  ]);
}
