import {View} from './index.js'

const myView = View({bgColor: 'error', p: 'md'}, [
    View({bgColor: 'success', p: 'md'}, 'Test')
])

const result = `
<html>
    <head>
        ${myView.toHead()}
    </head>
    <body>
        ${myView}
        <script>
            ${myView.toScript()}
        </script>
    </body>
</html>`
