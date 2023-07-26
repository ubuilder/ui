import { Alert, Button } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Preview } from "../components/Preview.js";
import { View } from "../../components/View.js";
import { AlertContainer } from "../../components/Alert.js";

export default ({ theme, prefix }) =>
  DocPage({ name: "Alert" }, [
    Section({ title: "Default" }, [
      Preview({ code: `Alert({title: 'This is Alert', icon: 'check'})` }),
    ]),
    Section({ title: "Content" }, [
      Preview({
        code: `Alert({title: 'This is Alert', icon: 'check'}, 'Description of alert')`,
      }),
    ]),
    Section({ title: "Colors" }, [
      Preview({
        code: `View({},[
                Alert({color: 'primary', title: 'Primary Alert', icon: 'check'}, 'This is Primary Alert'),
                Alert({color: 'secondary', title: 'Secondary Alert', icon: 'check'}, 'This is Secondary Alert'),
                Alert({color: 'success', title: 'Success Alert', icon: 'check'}, 'This is Success Alert'),
                Alert({color: 'error', title: 'Error Alert', icon: 'check'}, 'This is Error Alert'),
                Alert({color: 'warning', title: 'Warning Alert', icon: 'check'}, 'This is Warning Alert'),
                Alert({color: 'info', title: 'Info Alert', icon: 'check'}, 'This is Info Alert'),
            ])`,
      }),
    ]),
    Section({ title: "Dismissible" }, [
      Preview({
        code: `Alert({dismissible: true, title: 'You can close this alert', icon: 'check'}, 'Description of alert')`,
      }),
    ]),
    Section({ title: "AutoClose" }, [
      Preview({
        code: `Alert({autoClose: true, title: 'this will close in 5 seconds', icon: 'check'}, 'Description of alert')`,
      }),
    ]),

    Section({ title: "Container (static)" }, [
      Preview({
        code: `AlertContainer({name: 'my-alert-container'}, [
            Alert({title: 'First', icon: 'check'}, 'First Alert'),
            Alert({title: 'Second', color: 'error'}, 'Second Alert'),
        ])
        `,
      }),
    ]),
    Section(
      {
        title: "Container placement",
        description:
          "supported values are top-start, top-end, bottom-start and bottom-end",
      },
      [
        Preview({ code: `[
        
  View("Alert container is open in top-right side of page"),
  Button({ onClick: "$alert('my-alert-container-2', {title: 'Title',content: 'This is alert', color: 'primary'})" }, "Add Alert in this container"),
  AlertContainer({name: 'my-alert-container-2', placement: 'top-end'}, [
  Alert({title: 'Container Placement', icon: 'check'}, 'This is AlertContainer with top-end placement'),
])]`,
        }),
      ]
    ),
    Section(
      {
        title: "Container Add new Alerts",
        description: "You can use $alert magic to add new alerts",
      },
      [
        Preview({ code: `[
          View([
            Button(
              {
                onClick:
                  "$alert('my-alert-container-3', {content: 'Hello', color: 'info', dismissible: true})",
              },
              "Bottom right"

            ),
            Button(
                {
                  onClick:
                    "$alert('my-alert-container-2', {content: 'Hello', color: 'warning', dismissible: true})",
                },
                "top right"
  
              ),
          ]),
          AlertContainer({
            name: "my-alert-container-3",
            placement: "bottom-end",
          }),
        ]`}),
      ]
    ),
  ]);
