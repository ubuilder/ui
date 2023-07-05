import { Button } from "../../components/Button.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Col, Row } from "../../components/GridSystem.js";
import { Dropdown, DropdownPanel , DropdownItem } from "../../components/Dropdown.js";

export default function () {
  return DocPage({ name: "Dropdown" }, [
    Section({ title: "dropdown", description: "dropdown" }, [
        Row([
          Dropdown({label: 'Foods'},
            DropdownPanel(
              [
                DropdownItem({label: 'Rice'}),
                DropdownItem({label: 'Spagati'}),
                DropdownItem({label: 'Tunna'}),
              ]
            )
          )
      ]),
    ])
  ])
}
