import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbItemWrapper,
} from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";

const breadcrumb = ({ title, description }) => {
  return [
    Breadcrumb([
      BreadcrumbItemWrapper([
        BreadcrumbItem({ href: "/", active: true }, "Home"),
      ]),
      BreadcrumbItemWrapper([
        BreadcrumbItem({ href: "/blog", disabled: true }, "Blog"),
      ]),
      BreadcrumbItemWrapper([
        BreadcrumbItem({ href: "/blog/post-1" }, "Post 1"),
      ]),
    ]),
  ];
};

export default function () {
  return DocPage({ name: "breadcrumb" }, [
    breadcrumb("simple-breadcrumb", "desc...."),
  ]);
}
