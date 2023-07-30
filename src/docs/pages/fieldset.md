# Fieldset

## Default

```js
Fieldset({ $data: { input1: "", input2: "" } }, [
  Input({ name: "input1", label: "Input 1" }),
  Input({ name: "input2", label: "Input 2" }),
  Col({ justify: "end" }, [Button("Sumbit")]),
]);
```

## Title

```js
Card({ $data: { input1: "", input2: "", input3: "", input4: "" } }, [
  CardBody([
    Fieldset({ title: "Personal Details" }, [
      Input({ name: "input1", label: "Input 1" }),
      Input({ name: "input2", label: "Input 2" }),
    ]),
    Fieldset({ title: "Account Details" }, [
      Input({ name: "input1", label: "Input 1" }),
      Input({ name: "input2", label: "Input 2" }),
    ]),
  ]),
  CardFooter([Button({ms: 'auto'}, "Sumbit")]),
]);
```
