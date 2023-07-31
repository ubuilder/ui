# uLibs UI Components

Component Library for Javascript

These components are built as JavaScript functions that generate clean HTML code, leveraging the simplicity and efficiency of Alpine.js. You can use it in Node.js, Deno or Browser.

## Features

- Clean and intuitive design system.
- Consistent and minimalistic designs across all components.
- All components extend from a powerful base component called "View".
- Support for utility props, two-way binding, and more.

## Getting Started

### Installation

To use @ulibs/ui in your project, you can install it via npm or yarn:

```bash
npm install @ulibs/ui
```

or

```bash
yarn add @ulibs/ui
```

### Usage

Once you have installed the library, you can import the components in your JavaScript files and start using them

```js
import {View, Container, Row, Col} from '@ulibs/ui'

const myPage = View([
  Container({ size: "xl", mx: "auto" }, [
    Row([
      Col([Button("Column 1")]),
      Col({ col: 12, colSm: 6 }, [Button("Column 2")]),
    ]),
  ]),
]);

const myPageHtml = myPage.toHtml()

console.log(myPageHtml)
```

## Documentation
For detailed information on each component and its props, please refer to the full documentation. It provides examples and usage guidelines for all available components.
[Documentation](https://ubuilder.github.io/ui)

## Contributing
We welcome contributions to make @ulibs/ui even better! If you find a bug, have a suggestion, or want to add new features, feel free to submit an issue or create a pull request.

## License
@ulibs/ui is released under the MIT License.

Happy coding with uLibs UI! If you have any questions or need support, please don't hesitate to reach out.
