import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Preview } from "../components/Preview.js";

export default () => DocPage({name: 'Basic Features'}, [
    Section({title: 'If statement'}, [
        Preview({code: `View({
            $data: {show: true}
        }, [
            View({$text: 'show'}), 
            View({$if: 'show'}, 'Show is true')
        ])`})
    ]),
    Section({title: 'For loops'}, [
        Preview({code: `View({
    $data: {len: 8}
}, [
    View(['Length: ', View({tag: 'spna', $text: "len"})]), 
    View({border: true, d: 'flex', gap: 'xs'}, [
        View({$for: 'item in len', $text: 'item', p: 'xs'})
    ])
])`})
    ]),
    Section({title: 'Events'}, [
        Preview({code: `[
    View({$data: {count: 0}}, [
        Button({onClick: 'count++'}, [
            'Count:', View({tag: 'span', $text: 'count'})
        ])
    ])
]`})
    ]),
    Section({title: 'Bind Attributes'}, [
        Preview({code: `[
    View({$data: {disabled: false}}, [
        Button({onClick: 'disabled = !disabled', $text: "disabled ? 'Enable' : 'Disable'"}),
        Button({$color: "disabled ? 'secondary' : 'primary'"}, 'Color of this button is dynamic')
    ])
]`}),
Preview({code: `[
    View({$data: {size: 'sm'}}, [
        Select({items: ["sm", "md", "lg", "xl"], label: 'Size', name: 'size'}),
        View({ $p: 'size', border: true }, ['padding: ', View({tag: 'span', $text: 'size'})])
    ])
]`})
    ]),
    Section({title: 'Data'}, [
        Preview({code: `[
    View({$data: {name: "Name", username: 'Username'}}, [
        View(['data: ', View({tag: 'span', $text: 'JSON.stringify({name, username})'})]),
        
        View(['name: ', View({tag: 'span', $text: 'name'})]),
        View(['username: ', View({tag: 'span', $text: 'username'})]),
    ])
]`})
    ])
])