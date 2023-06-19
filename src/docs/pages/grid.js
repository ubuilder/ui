import { Col, Container, Row, View } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

const containerStyles = `border: 1px solid #d0d0d0;`;
const viewStyle = "border: 1px solid #b0b0b0; background-color: #d0d0d0;";

export default function () {
  return DocPage({ name: "Grid system" }, [
    Section({ title: "Container" }, [
      Container({ size: "xs", p: "md", mx: "auto", style: containerStyles }),
      Container({ size: "sm", p: "md", mx: "auto", style: containerStyles }),
      Container({ size: "md", p: "md", mx: "auto", style: containerStyles }),
      Container({ size: "lg", p: "md", mx: "auto", style: containerStyles }),
      Container({ size: "xl", p: "md", mx: "auto", style: containerStyles }),
      Container({ p: "md", style: containerStyles }),
    ]),
    Section({ title: "Row" }, [
      ["xs", "sm", "md", "lg", "xl"].map((size) =>
        Container({ size: "lg", mx: "auto" }, [
          View({ tag: "h3", mb: "sm", mt: "lg" }, "Gutter: " + size),
          Row({ gutter: size }, [
            Col({ cols: 2 }, View({ p: "sm", style: viewStyle }), "col 2"),
            Col({ cols: 4 }, View({ p: "sm", style: viewStyle }), "col 4"),
            Col({ cols: 6 }, View({ p: "sm", style: viewStyle }), "col 6"),
            Col({ cols: 8 }, View({ p: "sm", style: viewStyle }), "col 8"),
            Col({ cols: 1 }, View({ p: "sm", style: viewStyle }), "col 1"),
            Col({ cols: 1 }, View({ p: "sm", style: viewStyle }), "col 1"),
          ]),
        ])
      ),
    ]),
  ]);
}
