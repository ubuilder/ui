# View

View is the base component of `@ulibs/ui` library, and all other components are based on `View`, and all other components supports below features.

## Usage

View is just a wrapper which creates HTML Elements, and you can combine them to make anything that you want. View supports two props, one is for `Props / attributes` of component and other is list of it's children (`Slots`).

```js

```

## Slots

if component doesn't have props, you can pass slot as first argument. Slot can be of any type except `object` (but `Array` is allowed).

```js
[
  View(["This has only a slot"]),
  View(["This has", "more", "than one slots"]),
  View("you can pass string slots directly without using []"),
  View(123),
  ,
  View([View("item 1"), View("Item 2")]),
];
```

## Props

If component has prop, you should pass it as first argument, and move slot to second argument. Prop is always `object`.

```js
[
  View({ tag: "span" }, "This is inside span"),
  View({ class: "custom-class" }, "With Custom Class"),
  View({ onClick: "alert('Hello World!')" }, "Click Me!"),
];
```

## Return Value

View (and all components) returns an object which has these features: `toString`, `toHead`, `toScript`, `tag`, `props`, `slots`. you can use `toString` to render it as html code.

```js static
[
  `
const value = View({tag: 'span', class: 'custom'}, ["Content"]);
<br/><br/>
console.log(value) // &lt;span class="custom"&gt;Content&lt;/span&gt;
`,
];
```

## Components

All components are based on View and their usage are similar.

```js
View([
  Button([Spinner(), "Loading..."]),

  Progress({ my: "md", value: 40, color: "success" }),

  ButtonGroup([
    Button({ color: "secondary" }, "First"),
    Button({ color: "primary" }, "Second"),
  ]),
]);
```

## Tag

using tag prop you can change tag of component, all html tags are supported including (`html`,`script`, `body`, `style`, ....)

```js
View([
  View({ tag: "button" }, "Button"),
  View({ tag: "script" }, `const x = 1; console.log(x)`),
]);
```

## Script

You can register custom javascript code using `script` prop, at the end you can get all scripts using `toScript` method of component.

```js
[`View({ script: 'document.body.setAttribute("u-view-theme", "dark")' })`];
```

## Head

Also it is possible to add items in `<head>` section of page using `htmlHead` prop. they are accessible using `toHead` method.

```js
[
  `View([
  View({htmlHead: '&lt;title&gt;Change title of page&lt/;title&gt;'})
])`,
];
```

## Utilities

there are some useful props which you can use with these components.

## Margin

You can change margin of components using these props (`m`, `ms`, `me`, `mx`, `my`, `mt`, `mb`), supported values are (`0`, `auto`, `xxs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`).

```js
[
  View({ border: true, mb: "sm" }, [
    View({ m: "sm" }, "m=sm"),
    View({ m: "md" }, "m=md"),
    View({ m: "lg" }, "m=lg"),
    View({ m: "xl" }, "m=xl"),
  ]),
  View({ border: true, mb: "sm" }, [
    View({ ms: "sm" }, "ms=sm"),
    View({ ms: "md" }, "ms=md"),
    View({ ms: "lg" }, "ms=lg"),
    View({ ms: "xl" }, "ms=xl"),
  ]),
  View({ border: true, mb: "sm" }, [
    View({ my: "sm" }, "my=sm"),
    View({ my: "md" }, "my=md"),
    View({ my: "lg" }, "my=lg"),
    View({ my: "xl" }, "my=xl"),
  ]),
  "And so on...",
];
```

## Padding

Padding is similar to margin, but without `auto` value.

```js
[
  View({ border: true, mb: "sm" }, [
    View({ p: "sm" }, "p=sm"),
    View({ p: "md" }, "p=md"),
    View({ p: "lg" }, "p=lg"),
    View({ p: "xl" }, "p=xl"),
  ]),
  View({ border: true, mb: "sm" }, [
    View({ ps: "sm" }, "ps=sm"),
    View({ ps: "md" }, "ps=md"),
    View({ ps: "lg" }, "ps=lg"),
    View({ ps: "xl" }, "ps=xl"),
  ]),
  "...",
];
```

## Display

there are some props for supporting displays for responsive breakpoints. (`d`, `dXs`, `dSm`, `dMd`, `dLg`, `dXl`). sopports these vaules (`none`, `flex`, `inline-flex`, `block`, `inline`, `inline-block`, `contents`, `grid`)

```js
[
  View({ d: "flex" }, [View("A"), View("B"), View("C")]),

  View({ d: "block" }, [View("A"), View("B"), View("C")]),
  View({ d: "none", dMd: "block" }, "show in screens bigger than md"),
  "....",
];
```

## Width & Height

You can use `w` and `h` to set size of element. supported values are (`0`, `50`, `100`, `auto`, `xxs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`).

```js
[
  View({ border: true, w: "0" }, "w=0"),
  View({ border: true, w: "50" }, "w=50"),
  View({ border: true, w: "100" }, "w=100"),
  View({ border: true, w: "auto" }, "w=auto"),
  View({ border: true, w: "xxs" }, "w=xxs"),
  View({ border: true, w: "xs" }, "w=xs"),
  View({ border: true, w: "sm" }, "w=sm"),
  View({ border: true, w: "md" }, "w=md"),
  View({ border: true, w: "lg" }, "w=lg"),
  View({ border: true, w: "xl" }, "w=xl"),
  View({ border: true, w: "2xl" }, "w=2xl"),
  View({ border: true, w: "3xl" }, "w=3xl"),
  View({ border: true, w: "4xl" }, "w=4xl"),
  View({ border: true, w: "5xl" }, "w=5xl"),
  View({ border: true, w: "6xl" }, "w=6xl"),
];
```

## Height

And here is examples of height

```js
View({ d: "flex", flexDirection: "column", gap: "md" }, [
  View({ border: true, h: "0" }, "h=0"),
  View({ border: true, h: "50" }, "h=50"),
  View({ border: true, h: "100" }, "h=100"),
  View({ border: true, h: "auto" }, "h=auto"),
  View({ border: true, h: "xxs" }, "h=xxs"),
  View({ border: true, h: "xs" }, "h=xs"),
  View({ border: true, h: "sm" }, "h=sm"),
  View({ border: true, h: "md" }, "h=md"),
  View({ border: true, h: "lg" }, "h=lg"),
  View({ border: true, h: "xl" }, "h=xl"),
  View({ border: true, h: "2xl" }, "h=2xl"),
  View({ border: true, h: "3xl" }, "h=3xl"),
  View({ border: true, h: "4xl" }, "h=4xl"),
  View({ border: true, h: "5xl" }, "h=5xl"),
  View({ border: true, h: "6xl" }, "h=6xl"),
]);
```

## Flex Direction

View supports (`flexDirection`, `flexDirectionXs`, `flexDirectionSm`, ....) props which available values are: (`row`, `row-reverse`, `column` and `column-reverse`), these are only usable if display is `flex` or `inline-flex`

```js
View([
  View({ d: "flex", mb: "sm" }, [
    View({ border: true, p: "xs" }, "row item 1"),
    View({ border: true, p: "xs" }, "row item 2"),
    View({ border: true, p: "xs" }, "row item 3"),
  ]),
  View({ d: "flex", mb: "sm", flexDirection: "row-reverse" }, [
    View({ border: true, p: "xs" }, "row-reverse item 1"),
    View({ border: true, p: "xs" }, "row-reverse item 2"),
    View({ border: true, p: "xs" }, "row-reverse item 3"),
  ]),
  View({ d: "flex", mb: "sm", flexDirection: "column-reverse" }, [
    View({ border: true, p: "xs" }, "column-reverse item 1"),
    View({ border: true, p: "xs" }, "column-reverse item 2"),
    View({ border: true, p: "xs" }, "column-reverse item 3"),
  ]),
  View({ d: "flex", mb: "sm", flexDirection: "column" }, [
    View({ border: true, p: "xs" }, "column item 1"),
    View({ border: true, p: "xs" }, "column item 2"),
    View({ border: true, p: "xs" }, "column item 3"),
  ]),

  View(
    { d: "flex", mb: "sm", flexDirection: "column", flexDirectionMd: "row" },
    [
      View({ border: true, p: "xs" }, "column (md row) item 1"),
      View({ border: true, p: "xs" }, "column (md row) item 2"),
      View({ border: true, p: "xs" }, "column (md row) item 3"),
    ]
  ),
]);
```

## Flex Gap

gap prop is used to add spacing between flex items, supported values are(`xs`, `sm`, `md`, `lg`, `xl`).

```js
[
  View(
    {
      d: "flex",
      border: true,
      p: "xs",
      flexDirection: "column",
      mb: "md",
      gap: "xs",
    },
    [
      View({ border: true, p: "xxs" }, "gap=xs"),
      View({ border: true, p: "xxs" }, "gap=xs"),
      View({ border: true, p: "xxs" }, "gap=xs"),
      View({ border: true, p: "xxs" }, "gap=xs"),
    ]
  ),

  View(
    {
      d: "flex",
      border: true,
      p: "xs",
      flexDirection: "column",
      mb: "md",
      gap: "sm",
    },
    [
      View({ border: true, p: "xxs" }, "gap=sm"),
      View({ border: true, p: "xxs" }, "gap=sm"),
      View({ border: true, p: "xxs" }, "gap=sm"),
      View({ border: true, p: "xxs" }, "gap=sm"),
    ]
  ),

  View(
    {
      d: "flex",
      border: true,
      p: "xs",
      flexDirection: "column",
      mb: "md",
      gap: "md",
    },
    [
      View({ border: true, p: "xxs" }, "gap=md"),
      View({ border: true, p: "xxs" }, "gap=md"),
      View({ border: true, p: "xxs" }, "gap=md"),
      View({ border: true, p: "xxs" }, "gap=md"),
    ]
  ),

  View(
    {
      d: "flex",
      border: true,
      p: "xs",
      flexDirection: "column",
      mb: "md",
      gap: "lg",
    },
    [
      View({ border: true, p: "xxs" }, "gap=lg"),
      View({ border: true, p: "xxs" }, "gap=lg"),
      View({ border: true, p: "xxs" }, "gap=lg"),
      View({ border: true, p: "xxs" }, "gap=lg"),
    ]
  ),

  View(
    {
      d: "flex",
      border: true,
      p: "xs",
      flexDirection: "column",
      mb: "md",
      gap: "xl",
    },
    [
      View({ border: true, p: "xxs" }, "gap=xl"),
      View({ border: true, p: "xxs" }, "gap=xl"),
      View({ border: true, p: "xxs" }, "gap=xl"),
      View({ border: true, p: "xxs" }, "gap=xl"),
    ]
  ),
];
```

## Wrap

You can control wrapping of flex items using `wrap` boolean prop

```js
View({},[
  View({d: 'flex', mb: 'md', wrap: true}, [
  Button("wrap=true First"),
  Button("wrap=true Second"),
  Button("wrap=true Third"),
  Button("wrap=true Fourth")
]),

View({d: 'flex'}, [
  Button("wrap=false First"),
  Button("wrap=false Second"),
  Button("wrap=false Third"),
  Button("wrap=false Fourth")
])
])
```

<!-- import { Button, View } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({ name: "View" }, [
    Section({ title: "View", description: "This is View component" }, [
      Button({ onClick: "alert('clicked')" }, "Click"),
    ]),
    Section({title: 'width', description: 'You can change width of all elements using w property'}, [

      View({border: true, m: 'xs', borderColor: 'primary', w: 0}, 'Width = 0'),
      View({border: true, m: 'xs', borderColor: 'secondary', w: 50}, 'Width = 50'),
      View({border: true, m: 'xs', borderColor: 'success', w: 100}, 'Width = 100'),
      View({border: true, m: 'xs', borderColor: 'error', w: 'auto'}, 'Width = auto'),
      View({border: true, m: 'xs', borderColor: 'warning', w: 'xxs'}, 'Width = xxs'),
      View({border: true, m: 'xs', borderColor: 'info', w: 'xs'}, 'Width = xs'),
      View({border: true, m: 'xs', borderColor: 'dark', w: 'sm'}, 'Width = sm'),
      View({border: true, m: 'xs', borderColor: 'light', w: 'md'}, 'Width = md'),
      View({border: true, m: 'xs', textColor: 'secondary', w: 'lg'}, 'Width = lg'),
      View({border: true, m: 'xs', textColor: 'success', w: 'xl'}, 'Width = xl'),
      View({border: true, m: 'xs', textColor: 'error', w: '2xl'}, 'Width = 2xl'),
      View({border: true, m: 'xs', textColor: 'warning', w: '3xl'}, 'Width = 3xl'),
      View({border: true, m: 'xs', textColor: 'info', w: '4xl'}, 'Width = 4xl'),
      View({border: true, m: 'xs', textColor: 'dark', w: '5xl'}, 'Width = 5xl'),
      View({border: true, m: 'xs', textColor: 'light', w: '6xl'}, 'Width = 6xl'),

    ]),
    Section({title: 'height', description: 'You can change height of all elements using h property'}, [


      View({border: true, m: 'xs', borderColor: 'primary', h: 0}, 'Height = 0'),
      View({border: true, m: 'xs', borderColor: 'secondary', h: 50}, 'Height = 50'),
      View({border: true, m: 'xs', borderColor: 'success', h: 100}, 'Height = 100'),
      View({border: true, m: 'xs', borderColor: 'error', h: 'auto'}, 'Height = auto'),
      View({border: true, m: 'xs', borderColor: 'warning', h: 'xxs'}, 'Height = xxs'),
      View({border: true, m: 'xs', borderColor: 'info', h: 'xs'}, 'Height = xs'),
      View({border: true, m: 'xs', borderColor: 'dark', h: 'sm'}, 'Height = sm'),
      View({border: true, m: 'xs', borderColor: 'light', h: 'md'}, 'Height = md'),
      View({border: true, m: 'xs', bgColor: 'primary', h: 'lg'}, 'Height = lg'),
      View({border: true, m: 'xs', bgColor: 'secondary', h: 'xl'}, 'Height = xl'),
      View({border: true, m: 'xs', bgColor: 'success', h: '2xl'}, 'Height = 2xl'),
      View({border: true, m: 'xs', borderRadius: 'xs', bgColor: 'error', h: '3xl'}, 'Height = 3xl'),
      View({border: true, m: 'xs', borderRadius: 'sm', bgColor: 'warning', h: '4xl'}, 'Height = 4xl'),
      View({border: true, m: 'xs', borderRadius: 'md', bgColor: 'info', h: '5xl'}, 'Height = 5xl'),
      View({border: true, m: 'xs', borderRadius: 'lg', bgColor: 'dark', h: '6xl'}, 'Height = 6xl'),
      View({border: true, m: 'xs', borderRadius: 'xl', bgColor: 'light', h: '6xl'}, 'Height = 6xl'),

    ]),
    Section({title: 'Flex'}, [
      View({p: 'sm', d: 'flex', wrap: true, flexDirection: 'row', flexDirectionLg: 'column', border: true, align: 'center', justify: 'between', gap: 'sm'}, [
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'primary'}, 'Primary'),
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'secondary'}, 'Secondary'),
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),

        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),
      ])
    ])
  ]);
} -->
