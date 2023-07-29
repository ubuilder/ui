import { DocPage } from "../components/DocPage.js";
import { Preview } from "../components/Preview.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({ name: "Button" }, [
    Section({ title: "Default", description: "This is default Button" }, [
      Preview({ code: `Button("Default Button")` }),
    ]),
    Section({ title: "Colors", description: "Button supports these colors" }, [
      Preview({
        code: `View({d: 'flex', gap: 'xs', wrap: true}, [
  Button({color: 'primary'}, "Primary"),
  Button({a: '123', onClick: 'console.log(1)', color: 'secondary'}, "Secondary"),
  Button({color: 'success'}, "Success"),
  Button({color: 'info'}, "Info"),
  Button({color: 'warning'}, "Warning"),
  Button({color: 'error'}, "Error"),
  Button({color: 'light'}, "Light"),
  Button({color: 'dark'}, "Dark"),
])`,
      }),
    ]),
    Section({ title: "Disabled", description: "Button supports disabled state" }, [
      Preview({
        code: `View({d: 'flex', gap: 'xs', wrap: true}, [
  Button({disabled: true, color: 'primary'}, "Primary"),
  Button({disabled: true, color: 'secondary'}, "Secondary"),
  Button({disabled: true, color: 'success'}, "Success"),
  Button({disabled: true, color: 'info'}, "Info"),
  Button({disabled: true, color: 'warning'}, "Warning"),
  Button({disabled: true, color: 'error'}, "Error"),
  Button({disabled: true, color: 'light'}, "Light"),
  Button({disabled: true, color: 'dark'}, "Dark"),
])`,
      }),
    ]),
    Section({ title: "Active", description: "Button supports active state" }, [
      Preview({
        code: `View({d: 'flex', gap: 'xs', wrap: true}, [
  Button({active: true, color: 'primary'}, "Primary"),
  Button({active: true, color: 'secondary'}, "Secondary"),
  Button({active: true, color: 'success'}, "Success"),
  Button({active: true, color: 'info'}, "Info"),
  Button({active: true, color: 'warning'}, "Warning"),
  Button({active: true, color: 'error'}, "Error"),
  Button({active: true, color: 'light'}, "Light"),
  Button({active: true, color: 'dark'}, "Dark"),
])`,
      }),
    ]),

    Section({ title: "Link", description: "Only show text of button" }, [
      Preview({
        code: `View({d: 'flex', gap: 'xs', wrap: true}, [
        Button({link: true }, "Default"),
        Button({link: true, color: 'primary'}, "Primary"),
        Button({link: true, color: 'secondary'}, "Secondary"),
        Button({link: true, color: 'success'}, "Success"),
        Button({link: true, color: 'info'}, "Info"),
        Button({link: true, color: 'warning'}, "Warning"),
        Button({link: true, color: 'error'}, "Error"),
        Button({link: true, color: 'light'}, "Light"),
        Button({link: true, color: 'dark'}, "Dark"),
      ])`,
      }),
    ]),

    Section(
      {
        title: "With Icon",
        description: "You can use tabler-icons.io to get icon that you want",
      },
      [
        Preview({
          code: `View({d: 'flex', gap: 'xs'}, [
  Button([Icon({name: 'plus'}), 'Add User']),
  Button([Icon({name: 'pencil'}), 'Edit User']),
  Button([Icon({name: 'x'})]),
])`,
        }),
      ]
    ),
    Section(
      { title: "Sizes", description: "Button component supports these sizes" },
      [
        Preview({
          code: `View({d: 'flex', flexDirection: 'column', wrap: true,align: 'start', gap: 'xs'}, [
  Button({color: 'primary', size: 'xs'}, [Icon({name: 'info-circle'}) ,'Extra Small']),
  Button({color: 'primary', size: 'sm'}, [Icon({name: 'info-circle'}) ,'Small']),
  Button({color: 'primary', size: 'md'}, [Icon({name: 'info-circle'}) ,'Medium']),
  Button({color: 'primary', size: 'lg'}, [Icon({name: 'info-circle'}) ,'Large']),
  Button({color: 'primary', size: 'xl'}, [Icon({name: 'info-circle'}) ,'Extra Large']),
])`,
        }),
      ]
    ),
    Section(
      {
        title: "Button Group",
      },
      [
        Preview({code: `ButtonGroup([
  Button({ color: "primary" }, [Icon({ name: "check" }), "Primary"]),
  Button({ color: "secondary" }, [
    Icon({ name: "check" }),
    "Secondary",
  ]),
  Button({ color: "success" }, [Icon({ name: "check" }), "Success"]),
  Button({ color: "error" }, [Icon({ name: "check" }), "Error"]),
  Button({ color: "warning" }, [Icon({ name: "check" }), "Warning"]),
  Button({ color: "info" }, [Icon({ name: "check" }), "Info"]),
  Button({ color: "dark" }, [Icon({ name: "check" }), "Dark"]),
  Button({ color: "light" }, [Icon({ name: "check" }), "Light"]),
])`}),
      ]
    ),
    Section(
      {
        title: "Button Group compact",
      },
      [
        Preview({code: `ButtonGroup({compact: true}, [
  Button({ color: "primary" }, ["Start"]),
  Button({ color: "primary", active: true }, ["Center"]),
  Button({ color: "primary" }, ["End"]),
])`}),
      ]
    ),
  ]);
}
