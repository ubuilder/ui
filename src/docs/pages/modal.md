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
