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
CodeEditor({ label: "Template", value: "&lt;h1&gt;Hello&lt;/h1&gt;" });
```

## Language

Default language is hbs (Handlebars)

```js
[
  CodeEditor({
    label: "Template",
    lang: "html",
    value: "&lt;h1&gt;Hello&lt;/h1&gt;",
  }),
  CodeEditor({ label: "Style", lang: "css", value: ".h1 {color: red;}" }),
  CodeEditor({
    label: "Script",
    lang: "js",
    value: "console.log(&quot;Hello World!&quot;)",
  }),
];
```

## Bind Value

```js
View(
  {
    $data: {
      js: "console.log(\";Hello World!\")",
      html: "&lt;h1&gt;Hello&lt;/h1&gt;",
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

      $srcdoc: `'&lt;html&gt;&lt;head&gt;&lt;style&gt;' + css + '&lt;/style&gt;&lt;/head&gt;&lt;body&gt;' + html + '&lt;script&gt;' + js + '&lt;/script&gt;&lt;/body&gt;&lt;/html&gt;' `,
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
