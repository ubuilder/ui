import { Breadcrumb, BreadcrumbItem, View } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";

const breadcrumb = ({ title, description }) => {
  return [Breadcrumb([View({ style: "display: flex; gap: 8px", mt: "sm" },[
    BreadcrumbItem({ href: "/" }, "Home"),
    BreadcrumbItem({ href: "/blog" }, "Blog"),
    BreadcrumbItem({ href: "/blog/post-1" }, "Post 1"),
  ])])];
};

export default function () {
  return DocPage({ name: "breadcrumb" }, [
    breadcrumb('simple-breadcrumb', 'desc....'),
  ]);
}
