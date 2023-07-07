import { Button } from "../../components/Button.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Col, Row } from "../../components/GridSystem.js";
import { Dropdown, DropdownPanel , DropdownItem } from "../../components/Dropdown.js";

export default function () {
  return DocPage({ name: "Dropdown" }, [
    Section({ title: "dropdown", description: "dropdown" }, [
        Row({gap: 'md'},[
          Dropdown({label: 'Foods', margin: 'md'},
            DropdownPanel(
              [
                DropdownItem({label: 'Rice'}),
                DropdownItem({label: 'Spagati'}),
                DropdownItem({label: 'Tunna'}),
              ]
            )
          ),
          Dropdown({label: 'Foods', margin: 'md', arrow: false},
            DropdownPanel(
              [
                DropdownItem({label: 'Rice'}),
                DropdownItem({label: 'Spagati'}),
                DropdownItem({label: 'Tunna'}),
              ]
            )
          ),
          Dropdown({label: 'Foods', margin: 'md'},
            DropdownPanel(
              [
                DropdownItem({label: 'Rice', icon: 'user'}),
                DropdownItem({label: 'Spagati', icon: 'home'}),
                DropdownItem({label: 'Tunna', icon: 'star'}),
              ]
            )
          ),
          Dropdown({label: 'Pages', margin: 'md'},
            DropdownPanel(
              [
                DropdownItem({label: 'Tab',  href: '/compoenents/tab'}),
                DropdownItem({label: 'Modal',  href: '/components/modal'}),
                DropdownItem({label: 'Accordion', href: '/components/accordions'}),
              ]
            )
          )
      ]),
    ]),
    Section({ title: "dropdown", description: "dropdown" }, [
        Row({gap: 'md'},[
          Dropdown({label: 'Foods', margin: 'md', trigger: 'hover'},
            DropdownPanel(
              [
                DropdownItem({label: 'Rice'}),
                DropdownItem({label: 'Spagati'}),
                DropdownItem({label: 'Tunna'}),
              ]
            )
          ),
          Dropdown({label: 'Foods', margin: 'md', arrow: false, trigger: 'hover'},
            DropdownPanel(
              [
                DropdownItem({label: 'Rice'}),
                DropdownItem({label: 'Spagati'}),
                DropdownItem({label: 'Tunna'}),
              ]
            )
          ),
          Dropdown({label: 'Foods', margin: 'md', trigger: 'hover'},
            DropdownPanel(
              [
                DropdownItem({label: 'Rice', icon: 'user'}),
                DropdownItem({label: 'Spagati', icon: 'home'}),
                DropdownItem({label: 'Tunna', icon: 'star'}),
              ]
            )
          ),
          Dropdown({label: 'Pages', margin: 'md', trigger: 'hover'},
            DropdownPanel(
              [
                DropdownItem({label: 'Tab',  href: '/compoenents/tab'}),
                DropdownItem({label: 'Modal',  href: '/components/modal'}),
                DropdownItem({label: 'Accordion', href: '/components/accordions'}),
              ]
            )
          )
      ]),
    ])
  ])
}
