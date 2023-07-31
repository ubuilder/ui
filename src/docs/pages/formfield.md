# FormField

All Form Elements (`Checkbox`,`CheckboxGroup`,`Input`,`RadioGroup`,`Select`,`Autocomplete`,`TextEditor`) are based on FormField. You can make custom form elements using this component

## Defualt

```js
FormField({}, [Button(["Custom Form Field"])]);
```

## Label

```js
FormField({ label: "Custom Field" }, [Button(["Custom Form Field"])]);
```

## Description

```js
FormField(
  { label: "Custom Field", description: "this is description of custom field" },
  [Button(["Custom Form Field"])]
);
```
