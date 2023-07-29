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
            Col({ col: 2 }, View({ p: "sm", style: viewStyle }, "col 2")),
            Col({ col: 4 }, View({ p: "sm", style: viewStyle }, "col 4")),
            Col({ col: 6 }, View({ p: "sm", style: viewStyle }, "col 6")),
            Col({ col: 8 }, View({ p: "sm", style: viewStyle }, "col 8")),
            Col({ col: 0 }, View({ p: "sm", style: viewStyle }, "col 0")),
            Col({ col: true }, View({ p: "sm", style: viewStyle }, "col auto")),
          ]),
        ])
      ),
    ]),

    Section({ title: "Col" }, [
      Container({ size: "lg", mx: "auto" }, [
        View({ tag: "h3", mb: "sm", mt: "lg" }, "Col sizes"),
        Row([
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, true].map((col) =>
            Col({ col }, View({ p: "sm", style: viewStyle }, "col " + col))
          ),
        ]),
      ]),
    ]),
    Section({ title: "Col grow and auto" }, [
      Container({ size: "lg", mx: "auto" }, [
        View("Col sizes"),
        Row([
          Col(
            { col: 0 },
            View(
              { p: "sm", style: viewStyle },
              "col=0 set width same as it's content"
            )
          ),
          Col(
            { col: true },
            View(
              { p: "sm", style: viewStyle },
              'and col="true" tries to expand and fill empty space'
            )
          ),
        ]),
      ]),
    ]),
    Section({ title: "Col Offset" }, [
      Container({ size: "lg", mx: "auto" }, [
        Row([
          Col(
            { col: 3, offset: 3 },
            View({ p: "sm", style: viewStyle }, "col offset 3")
          ),
          Col(
            { offset: 3, col: 3 },
            View({ p: "sm", style: viewStyle }, "col offset 3")
          ),
          Col(
            { col: 3, offset: 0 },
            View({ p: "sm", style: viewStyle }, "col offset 3")
          ),
          Col(
            { offset: 3, col: 3 },
            View({ p: "sm", style: viewStyle }, "col offset 3")
          ),
          Col(
            { offset: 3, col: 3 },
            View({ p: "sm", style: viewStyle }, "col offset 3")
          ),
        ]),
      ]),
    ]),
    Section({ title: "Col Sizes" }, [
      Row([
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          { col: 12, colXs: 6, colSm: 4, colMd: 3, colLg: 2, colXl: 1 },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
      ]),
    ]),
    Section({ title: "Offset Sizes" }, [
      Row([
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
        Col(
          {
            col: 12,
            colXs: 6,
            colSm: 4,
            colMd: 3,
            colLg: 2,
            colXl: 1,
            offset: 0,
            offsetXs: 6,
            offsetSm: 8,
            offsetMd: 9,
            offsetLg: 10,
            offsetXl: 11,
          },
          View({ p: "sm", style: viewStyle }, "Dynamic")
        ),
      ]),
    ]),
  ]);
}
