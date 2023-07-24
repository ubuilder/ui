import { extract } from "./src/utils.js"

// {input: ['name', 'value', 'disabled'], wrapper: ['label'], col: ['col', 'colSm', 'colXs']}, 
const value = extract({
    name: 'hadi',
    label: 'this is label',
    $label: 'bound_to_something',
    $disabled: '!active',
    $color: 'yellow',
    col: 12,
    colMd: 44,
    color: 'primary',
    mb: 'sm'
}, {
    'name': 'default', 
    'label': undefined,
    cssProps: {
        color: 'red',
        a: undefined
    }
})

console.log(value)
