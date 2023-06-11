import { Breadcrumb, BreadcrumbItem, View } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";

const breadcrumb = ({ title, description }) => {
  return [Breadcrumb([
    BreadcrumbItem({ href: "/", active:true}, "Home"),
    BreadcrumbItem({ href: "/blog", disabled:true}, "Blog"),
    BreadcrumbItem({ href: "/blog/post-1" }, "Post 1"),
  ])];
};

export default function () {
  return DocPage({ name: "breadcrumb" }, [
    breadcrumb('simple-breadcrumb', 'desc....'),
  ]);
}
