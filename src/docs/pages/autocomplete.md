# Autocomplete

## Default

```js
View({ style: "height: 400px", $data: { auto: "" } }, [
  View({ mb: "sm" }, ["Value: ", View({ $text: "auto" })]),
  Autocomplete({
    label: "Autocomplete",
    items: ["Item 1", "Item 2", "Item 3", "Item 4"],
    name: "auto",
    placeholder: "This is placeholder",
  }),
]);
```

## Multiple

```js
View({ style: "height: 400px", style: "height: 400px", $data: { auto: [] } }, [
  View({ mb: "sm" }, ["Value: ", View({ $text: "auto" })]),
  Autocomplete({
    label: "Autocomplete",
    items: ["Item 1", "Item 2", "Item 3", "Item 4"],
    multiple: true,
    name: "auto",
    placeholder: "This is placeholder",
  }),
]);
```

## Create new items

when create prop is true, you can create new items using autocomplete input, onCreated will be executed when item is created

```js
View({ style: "height: 400px", $data: { auto: [] } }, [
  View({ mb: "sm" }, ["Value: ", View({ $text: "auto" })]),
  Autocomplete({
    label: "Autocomplete",
    items: ["Item 1", "Item 2", "Item 3", "Item 4"],
    create: true,
    onCreate: "console.log('add new item to list: ', $event)",
    name: "auto",
    placeholder: "This is placeholder",
  }),
]);
```

## Different key and text

You can pass key and text props to use a field of the object as value and it's text.

```js
View({ style: "height: 400px", $data: { auto: [] } }, [
  View({ mb: "sm" }, ["Value: ", View({ $text: "auto" })]),
  Autocomplete({
    label: "Autocomplete",
    items: [
      { key: "item1", text: "Item 1" },
      { key: "item2", text: "Item 2" },
      { key: "item3", text: "Item 3" },
      { key: "item4", text: "Item 4" },
    ],
    key: "key",
    name: "auto",
    placeholder: "This is placeholder",
    multiple: true,
    text: (x) => x.text,
  }),
]);
```

## Inside form + Submit value

```js
View({ style: "height: 500px" }, [
  Form({ $data: { job: "", name: "" } }, [
    Input({ name: "name", label: "Name" }),
    Autocomplete({
      label: "Job",
      items: [
        { key: "job-1", text: "Web Developer" },
        { key: "job-2", text: "Engineer" },
        { key: "job-3", text: "Doctor" },
        { key: "job-4", text: "Driver" },
      ],
      key: "key",
      name: "job",
      placeholder: "Choose a job",
      text: "text",
    }),
  ]),
]);
```

## Autocomplete with Icon

```js
View({
  tag: "img",
  src: "https://user-images.githubusercontent.com/42554876/255923365-3e55edc1-1d67-4633-bdea-03d71537a378.png",
});
```
