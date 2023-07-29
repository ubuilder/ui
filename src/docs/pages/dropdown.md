# Dropdown

## Default

this is defualt Dropdown component

```js
Dropdown(
  { label: "Foods", margin: "md" },
  DropdownPanel([
    DropdownItem({ label: "Rice" }),
    DropdownItem({ label: "Spagati" }),
    DropdownItem({ label: "Tunna" }),
  ])
);
```

## hover

```js
Row({gap: 'md'},[
          Dropdown({label: 'Foods', margin: 'md', trigger: 'hover'},
            DropdownPanel(
              [
                DropdownItem({label: 'Rice'}),
                DropdownItem({label: 'Spagati'}),
                DropdownItem({label: 'Tunna'}),
              ]
            )
          ),

          Dropdown({label: 'Foods', margin: 'md', trigger: 'hover'},
            DropdownPanel(
              [
                DropdownItem({label: 'Rice', icon: 'user'}),
                DropdownItem({label: 'Spagati', icon: 'home'}),
                DropdownItem({label: 'Tunna', icon: 'star'}),
              ]
            )
          ),
          Dropdown({label: 'Pages', margin: 'md', trigger: 'hover'},
            DropdownPanel(
              [
                DropdownItem({label: 'Tab',  href: '/compoenents/tab'}),
                DropdownItem({label: 'Modal',  href: '/components/modal'}),
                DropdownItem({label: 'Accordion', href: '/components/accordions'}),
              ]
            )
          )
      ]),
```

## click

```js
Row({gap: 'md'},[
          Dropdown({label: 'Foods', margin: 'md', trigger: 'hover'},
            DropdownPanel(
              [
                DropdownItem({label: 'Rice'}),
                DropdownItem({label: 'Spagati'}),
                DropdownItem({label: 'Tunna'}),
              ]
            )
          ),
          Dropdown({label: 'Foods', margin: 'md', trigger: 'hover'},
            DropdownPanel(
              [
                DropdownItem({label: 'Rice', icon: 'user'}),
                DropdownItem({label: 'Spagati', icon: 'home'}),
                DropdownItem({label: 'Tunna', icon: 'star'}),
              ]
            )
          ),
          Dropdown({label: 'Pages', margin: 'md', trigger: 'hover'},
            DropdownPanel(
              [
                DropdownItem({label: 'Tab',  href: '/compoenents/tab'}),
                DropdownItem({label: 'Modal',  href: '/components/modal'}),
                DropdownItem({label: 'Accordion', href: '/components/accordions'}),
              ]
            )
          )
      ]),
```

## without arrow

```js
Row({gap: 'md'},[
  Dropdown({label: 'Foods', margin: 'md', arrow: false},
    DropdownPanel(
      [
        DropdownItem({label: 'Rice'}),
        DropdownItem({label: 'Spagati'}),
        DropdownItem({label: 'Tunna'}),
      ]
    )
  ),
  Dropdown({label: 'Foods', margin: 'md', arrow: false, trigger: 'hover'},
    DropdownPanel(
      [
        DropdownItem({label: 'Rice'}),
        DropdownItem({label: 'Spagati'}),
        DropdownItem({label: 'Tunna'}),
      ]
    )
  ),
]),
```
