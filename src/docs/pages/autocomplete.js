import { Button } from "../../components/Button.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Preview } from "../components/Preview.js";

import { Autocomplete } from "../../components/index.js";
import { View } from "../../components/View.js";

export default function () {
  return DocPage({ name: "Autocomplete" }, [
    Section(
      {
        title: "Default",
      },
      [
        Preview({
          height: 400,
          code: `View({style: 'width: 250px', $data: {auto: ''}}, [
  View({mb: 'sm'},['Value: ', View({tag: 'span', $text: 'auto'})]),
  Autocomplete({
    label: "Autocomplete",
    items: [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4",
    ], 
    name: 'auto',
    placeholder: 'This is placeholder',
  }),
])`,
        }),
      ]
    ),
    Section(
      {
        title: "Multiple",
      },
      [
        Preview({
          height: 400,
          code: `View({style: 'width: 250px', $data: {auto: []}}, [
  View({mb: 'sm'},['Value: ', View({tag: 'span', $text: 'auto'})]),
  Autocomplete({
    label: "Autocomplete",
    items: [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4",
    ], 
    multiple: true,
    name: 'auto',
    placeholder: 'This is placeholder',
  }),
])`,
        }),
      ]
    ),
    Section(
      {
        description:
          "when create prop is true, you can create new items using autocomplete input, onCreated will be executed when item is created",
        title: "Create new Items",
      },
      [
        Preview({
          height: 400,
          code: `View({style: 'width: 250px', $data: {auto: []}}, [
  View({mb: 'sm'},['Value: ', View({tag: 'span', $text: 'auto'})]),
  Autocomplete({
    label: "Autocomplete",
    items: [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4",
    ], 
    create: true,
    onCreate: "console.log('add new item to list: ', $event)",
    name: 'auto',
    placeholder: 'This is placeholder',
  }),
])`,
        }),
      ]
    ),
    Section(
      {
        title: "Different key and text",
        description:
          "You can pass key and text props to use a field of the object as value and it's text.",
      },
      [
        Preview({
          height: 400,
          code: `View({style: 'width: 250px', $data: {auto: []}}, [
  View({mb: 'sm'},['Value: ', View({tag: 'span', $text: 'auto'})]),
  Autocomplete({
    label: "Autocomplete",
    items: [
      { key: "item1", text: "Item 1" },
      { key: "item2", text: "Item 2" },
      { key: "item3", text: "Item 3" },
      { key: "item4", text: "Item 4" },
    ], 
    key: 'key',
    name: 'auto',
    placeholder: 'This is placeholder',
    multiple: true,
    text: (x) => x.text,
  }),
])`,
        }),
      ]
    ),

    Section(
      {
        title: "Inside form + Submit value",
      },
      [
        Preview({
          height: 400,
          code: `Form({ style: 'width: 300px', $data: {job: '', name: ''}}, [
  Input({ name: 'name', label: 'Name'}),
  Autocomplete({
    label: "Job",
    items: [
      { key: "job-1", text: "Web Developer" },
      { key: "job-2", text: "Engineer" },
      { key: "job-3", text: "Doctor" },
      { key: "job-4", text: "Driver" },
    ], 
    key: 'key',
    name: 'job',
    placeholder: 'Choose a job',
    text: 'text',
  }),
])`,
        }),

        Section(
          {
            title: "Autocomplete with Icon",
          },
          [
            Preview({
              height: 400,
              code: `View({tag: 'img', src: 'https://user-images.githubusercontent.com/42554876/255923365-3e55edc1-1d67-4633-bdea-03d71537a378.png'})`,
            }),
          ]
        ),
      ]
    ),

    // Section({ title: "auto complete", description: "does not create new items and only selets one" }, [
    //     AutoComplete(
    //       {
    //         items,
    //         id: 'second',
    //         create: false,
    //         maxIems: 1
    //       }
    //       )
    // ]),
    // Section({ title: "auto complete", description: "simple auto complete with default settings" }, [
    //     AutoComplete({
    //       items,
    //       id: 'third',
    //       placeholder: 'select'

    //     })
    // ]),
  ]);
}
