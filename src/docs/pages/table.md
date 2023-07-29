# Table

## Default

```js
Table([
    TableHead([
        TableCell("ID"),
        TableCell("Name"),
        TableCell("Email"),
        TableCell(),
    ]),
    TableBody([
        [1,2,3,4,5].map(id => TableRow([
            TableCell(id),
            TableCell("Name " + id),
            TableCell("Email " + id),
            TableCell({w: 0}, [
                TableActions([
                    Button([Tooltip('View'), Icon({name: 'eye'})]),
                    Button({color: 'info'}, [Tooltip('Update'), Icon({name: 'pencil'})]),
                    Button({color: 'error'}, [Tooltip('Remove'), Icon({name: 'trash'})]),
                ])
            ]),
        ]))

    ]),
])
```

## Striped

```js
"TODO"
```

## Data Table 
it has `rows` and `columns` prop and renders large amount of data with pagination, sort and filters...
