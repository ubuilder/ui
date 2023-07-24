import { props } from "./src/utils.js"

const value = props({input: ['name', 'value', 'disabled'], wrapper: ['label'], col: ['col', 'colSm', 'colXs']}, {
    name: 'hadi',
    label: 'this is label',
    $label: 'bound_to_something',
    $disabled: '!active',
    col: 12,
    colMd: 44,
    mb: 'sm'
})

console.log(value)
