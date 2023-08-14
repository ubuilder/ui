# Code Editor

## Default

```js
CodeEditor();
```

## Label

```js
CodeEditor({ label: "Template" });
```


## Placeholder

```js
CodeEditor({ label: "Template", placeholder: 'Enter HTML Template' });
```

## Disabled

```js
CodeEditor({ label: "Template", disabled: true, placeholder: 'Enter HTML Template' });
```

## Readonly

```js
CodeEditor({ label: "Template", readonly: true, value: '// This is readonly code' });
```


## Initial Value

```js
CodeEditor({ label: "Template", value: "<h1>Hello</h1>" });
```

## Language

Default language is hbs (Handlebars)

```js
[
  CodeEditor({
    label: "Template",
    lang: "html",
    value: "<h1>Hello</h1>",
  }),
  CodeEditor({ label: "Style", lang: "css", value: ".h1 {color: red;}" }),
  CodeEditor({
    label: "Script",
    lang: "js",
    value: 'console.log("Hello World!")',
  }),
];
```

## Bind Value

```js
View(
  {
    $data: {
      js: `console.log("Hello World!")`,
      html: "<h1>Hello</h1>",
      css: "h1 {color: red;}",
    },
  },
  [
    Row([
      CodeEditor({ label: "Template", lang: "html", name: "html" }),
      CodeEditor({ label: "Style", lang: "css", name: "css" }),
      CodeEditor({ label: "Script", lang: "js", name: "js" }),
    ]),

    View({
      tag: "iframe",
      mt: "lg",
      w: 100,
      h: '6xl',
      border: true,
      borderColor: 'base-400',

      $srcdoc: `'<html><head><style>' + css + '</style></head><body>' + html + '<script>' + js + '&lt;/script></body></html>' `,
    }),
  ]
);
```

## With Form

```js
Form(
  {
    style: 'max-width: 400px',
    method: "GET",
    action: "/ui/code-editor",
    $data: { name: "", template: "", script: '' },
  },
  [
    Input({ name: "name", label: "Component Name" }),
    CodeEditor({ name: "template", label: "Template", lang: "html" }),
    CodeEditor({ name: "script", lang: 'js', label: "Script" }),
    Col({col: 12, justify: 'end'}, [
        Button({ color: "primary" }, "Create Component"),
    ])
  ]
);
```
