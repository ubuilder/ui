# Grid system

## Container

```js
Section({ title: "Container" }, [
    Container({ size: "xs", p: "md", mx: "auto", style: containerStyles }),
    Container({ size: "sm", p: "md", mx: "auto", style: containerStyles }),
    Container({ size: "md", p: "md", mx: "auto", style: containerStyles }),
    Container({ size: "lg", p: "md", mx: "auto", style: containerStyles }),
    Container({ size: "xl", p: "md", mx: "auto", style: containerStyles }),
    Container({ p: "md", style: containerStyles }),
]),
```

## sss

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
