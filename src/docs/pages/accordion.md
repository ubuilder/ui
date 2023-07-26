# Accordion

## Default

```js
Accordions([
    Accordion({
        header: "Accordion #1",
        body: [
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas quos explicabo voluptates, autem, ipsum sapiente maiores sed sit minus facere maxime veniam iste aut magnam. Magni voluptates deleniti nemo minima."
        ]
    }),
    Accordion({
        header: View({d: 'flex', gap: 'xs'}, ["Accordion #3", Badge('New'), Badge({color: 'error'}, 'Required')]),
        body: [
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas quos explicabo voluptates, autem, ipsum sapiente maiores sed sit minus facere maxime veniam iste aut magnam. Magni voluptates deleniti nemo minima.", 
            ButtonGroup([
                Button('Previous'),
                Button({color: 'primary'}, 'Next')
            ])
        ]
    }),

    Accordion({
        header: ["Accordion #3", Badge('New')],
        body: [
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas quos explicabo voluptates, autem, ipsum sapiente maiores sed sit minus facere maxime veniam iste aut magnam. Magni voluptates deleniti nemo minima.", 
            ButtonGroup([
                Button('Previous'),
                Button({color: 'primary'}, 'Submit')
            ])
        ]
    }),
])
```

## Persistent

```js
["TODO: Add persistent feature for Accordion"]
```
