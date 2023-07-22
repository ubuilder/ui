import { Row } from "../../components/GridSystem.js";
import { Button, ButtonGroup, FormField, View } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default () => DocPage({name: 'FormField'}, [
    Section({title: 'Default'}, [
        FormField({label: 'Custom input'}, [
            View({tag: 'input', 'u-input': true})
        ])
    ]),
    Section({title: 'Cols', description: 'Form Field component supports column and offset props of Grid system'}, [
        Row([

            FormField({label: 'Buttons in Form', colSm: 6}, [
                ButtonGroup({compact: true}, [
                    Button('H1'),
                    Button('H2'),
                    Button('H3'),
                    Button('H4'),
                    Button('H5'),
                    Button('H6'),
                ])
            ]),
            FormField({label: 'Buttons in Form', colSm: 6}, [
                ButtonGroup({compact: true}, [
                    Button('H1'),
                    Button('H2'),
                    Button('H3'),
                    Button('H4'),
                    Button('H5'),
                    Button('H6'),
                ])
            ])
    
        ])

    ]),
])