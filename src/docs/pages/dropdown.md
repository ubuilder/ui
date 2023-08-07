# Dropdown

## Default

this is defualt Dropdown component

```js
Dropdown([
  Button('dropdown'),
  DropdownPanel([
    DropdownItem({ label: "Rice" }),
    DropdownItem({ label: "Spagati" }),
    DropdownItem({ label: "Tunna" }),
  ])]
)
```


## arrow and hover

arrow: true(default), false 
trigger: click(defaut), hover

```js
Dropdown({ margin: 'md' , trigger: 'hover', arrow: false},
  [
    Button('arrow and hover'),
    DropdownPanel(
      [
        DropdownItem({label: 'Rice'}),
        DropdownItem({label: 'Spagati'}),
        DropdownItem({label: 'Tunna'}),
      ]
    )
  ]
)
```

## items icon property

icon prop can have the name of icons defalut value is 'undefined' means no icon


```js
Dropdown({label: 'Foods', margin: 'md', arrow: false},
  [
    Icon({name:'user' , style: 'border: 1px solid gray', target: true}),
    DropdownPanel(
      [
        DropdownItem({label: 'Rice', icon: 'user'}),
        DropdownItem({label: 'Spagati', icon: 'home'}),
        DropdownItem({label: 'Tunna', icon: 'star'}),
      ]
    )
  ]
),
```

## items href property
href property defines the dropdown items as anchor tag with href property equalt to item's href property

```js
Dropdown({label: 'Pages', margin: 'md', arrow: false},
  [
    Avatar({arrow : false, style: 'color:gray', border: 'sm'},"AV"),
    DropdownPanel(
      [
        DropdownItem({label: 'Tab',  href: '/ui/icon'}),
        DropdownItem({label: 'Modal',  href: '/ui/modal'}),
        DropdownItem({label: 'Accordion', href: '/ui/accordions'}),
      ]
    )
  ]
)
```
