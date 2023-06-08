import { Breadcrumb, BreadcrumbItem } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({ name: "breadcrumb" }, [
    Section({
      title: "BreadCrumb",
      description: "This is Breadcrumb component",
    }),
    Section(
      {
        title: "simple breadcrumb",
        description: "simple ...",
      },
      [
        Breadcrumb({}, [
          BreadcrumbItem({ href: "/" }, "Home"),
          BreadcrumbItem({ href: "/blog" }, "Blog"),
          BreadcrumbItem({ href: "/blog/post-1" }, "Post 1"),
        ]),
      ]
    ),
  ]);
}
