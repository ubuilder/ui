import { DocPage } from "../components/DocPage.js";
import { Preview } from "../components/Preview.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({ name: "Modal" }, [
    Section({ title: "Default", description: "This is default Modal" }, [
      Preview({ code: `[
    Button({onClick: "$modal.open('modal-1')", color: 'primary'}, "Open Modal"),
    Modal({name: 'modal-1'}, [
        ModalBody([
            View("Body of Modal"),
            View({mt: 'md'}, [
                Button({onClick: '$modal.close()'}, 'Close')
            ])
        ])
    ])
]` }),
    ]),
    Section({ title: "Persistent", description: "This is persistent Modal" }, [
        Preview({ code: `[
    Button({onClick: "$modal.open('modal-2')", color: 'primary'}, "Open Persistent Modal"),
    Modal({name: 'modal-2', persistent: true}, [
        ModalBody([
            View("You can only close me using below button"),
            View({mt: 'md'}, [
                Button({onClick: '$modal.close()'}, 'Close')
            ])
        ])
    ])
]` }),
      ]),
  ]);
}
