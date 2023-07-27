# Modal

## Default

This is default Modal

```js
[
  Button({ onClick: "$modal.open('modal-1')", color: "primary" }, "Open Modal"),
  Modal({ name: "modal-1" }, [
    ModalBody([
      View("Body of Modal"),
      View({ mt: "md" }, [Button({ onClick: "$modal.close()" }, "Close")]),
    ]),
  ]),
];
```

## Size

```js
[
  Button({onClick: "$modal.open('modal-size-xs')"}, "Extra Small"),
  Button({onClick: "$modal.open('modal-size-sm')"}, "Small"),
  Button({onClick: "$modal.open('modal-size-md')"}, "Medium"),
  Button({onClick: "$modal.open('modal-size-lg')"}, "Large"),
  Button({onClick: "$modal.open('modal-size-xl')"}, "Extra Large"),
  Button({onClick: "$modal.open('modal-size-auto')"}, "Auto"),
  ['xs', 'sm', 'md', 'lg', 'xl'].map(size => {
    return Modal({name: 'modal-size-' + size, size}, [
      ModalBody([
        "content of " + size + " modal..."
      ])
    ])
  }),
  Modal({name: 'modal-size-auto'}, [
    ModalBody([
      'Content of auto modal... (size is calculated based on its content)'
    ])
  ])
]
```

## Persistent

This is persistent Modal

```js
[
  Button(
    { onClick: "$modal.open('modal-2')", color: "primary" },
    "Open Persistent Modal"
  ),
  Modal({ name: "modal-2", persistent: true }, [
    ModalBody([
      View("You can only close me using below button"),
      View({ mt: "md" }, [Button({ onClick: "$modal.close()" }, "Close")]),
    ]),
  ]),
];
```

## With Form

```js
[
  Button({ onClick: "$modal.open('login-form')", color: "primary" }, "Login"),
  Modal({name: 'login-form', size: 'xs'}, [
    ModalBody([
      Form({$data: {username: '', password: ''}}, [
        Input({ name: "username", label: "Username" }),
        Input({ name: "password", label: "Password", type: "password" }),
        Col({col: 12}, [
          ButtonGroup({ justify: "end" }, [
            Button({ onClick: '$modal.close()', type: "button" }, "Cancel"),
            Button({ color: "primary" }, "Login"),
          ]),
                  ])

      ]),
    ]),
  ]),
];
```

## Card inside Modal
```js
[
  Button({onClick: "$modal.open('modal-card')"}, "Open"),
  Modal({name: 'modal-card', size: 'xs'}, [
    Card([
      CardHeader([
        CardTitle("Card Title")
      ]),
      CardBody([
        'Content of card body Sdfa sdflkasjdfio sadif aosdif aifoa sidf weio fasoidfasdif oasidf oasdif asoidf aosidf oasidf weifwioe fioe fiwf oisd gdoig aoif cxbaoisfn aovim asofsmd lfks afoi kdfa sofi awefao isd fjsaoidfmewaosi foas idf oaiej aksdf aojf we.'
      ]),
      CardFooter([
        ButtonGroup({ms: 'auto'},[
          Button({color: 'primary'}, "Submit")
        ])
      ])
    ])
  ])
]

```
