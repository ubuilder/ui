# Textarea

## Default

```js
Textarea();
```

## Label

```js
Textarea({ label: "Textarea" });
```

## Disabled



## Placeholder

```js
Textarea({ label: "Textarea", placeholder: "Enter text..." });
```

## Initial Value

```js
Textarea({ label: "Initial Value", value: "Initial Text of textarea" });
```

## Bind Value

```js
View({ $data: { content: "" } }, [
  Textarea({
    name: "content",
    placeholder: "Enter some text...",
    label: "Content",
  }),
  View({ tag: "p", mt: "md", $text: "content" }),
]);
```

## Column Width
All properties of `Col` component is supported
```js
Row([
    Textarea({col: 12, colXs: 6, colMd: 4}),
    Textarea({col: 12, colXs: 6, colMd: 2, offsetMd: 2}),
    Textarea({col: 12, colXs: 6, colMd: 4}),
])
```

## With Form
TODO: 
```js
Form({ method: 'GET', action: '/ui/textarea', $data: { title: "", description: "" } }, [
  Input({ label: "Title", name: "title" }),
  Textarea({ label: "Description", name: "description" }),
  Button({ color: "primary" }, "Submit"),
]);
```
