
Card({ title: "Card" }, [
    CardBody({ row: true }, [
        Input({ col: 6 }),
        Input({ col: 6 })
    ]),
]);

View({ container: "xl" }, [
    View({ row: true }, [
        View({ col: "4" }, "col 1"),
        View({ col: "4" }, "col 2"),
        View({ col: "4" }, "col 3"),
        View({ col: true }, "col 4"),
    ]),
]);

Container({ size: "xl" }, [
    Row([
        Col("col 1"),
        Col({ col: "4" }, "col 2"),
        Col({ col: "4" }, "col 3"),
        Col("col 4"),
    ]),
]);

// Container({ size: "lg" }, [
//   Row({ gutter: "sm" }, [
//     Input({ col: 6 }, "col 1"),
//     Input({ col: 6 }, "col 2"),
//     Col({ col: 12 }, "col 3"),
//     Col({ col: 12 }, "col 4"),
//   ]),
// ]);

// Container[size="lg"] {
//     Row[gutter="sm"] {
//         Input[col="6"] {
//             Col 1
//         }
//         Input[col="6"] {
//             col 2
//         }
//         Col[col="12"] {
//             col 3
//         }
//         Col[col="12"] {
//             col
//         }
//     }
// }

// <Container size="lg">
//   <Row gutter="sm">
//     <Input col="6">Col 1</Input>
//     <Input col="6">Col 2</Input>
//     <Col col="12">Col 3</Col>
//     <Col col="12">Col 4</Col>
//   </Row>
// </Container>;
