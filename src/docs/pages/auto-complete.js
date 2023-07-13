import { Button } from "../../components/Button.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { AutoComplete } from "../../components/AutoComplete.js";
import { View } from "../../components/View.js";

export default function () {
  let items = [ 
  {value: 'item1', text: 'item1'},
  {value: 'item2', text: 'item2'},
  {value: 'item3', text: 'item3'},
  {value: 'item5', text: 'item5'},
]
  return DocPage({ name: "AutoComplete" }, [
    Section({ title: "auto complete", description: "simple auto complete with default settings" }, [   
        AutoComplete({
          items, 
          values: ['item1', 'item2'], 
          id: 'first'
        }, [
          View({tag: 'div',"u-text": "JSON.stringify(items)"},  ),
          View({tag: 'div',"u-text": "JSON.stringify(values)"},  )

        ]),
    ]),



    Section({ title: "auto complete", description: "does not create new items and only selets one" }, [   
        AutoComplete(
          {
            items, 
            id: 'second',
            create: false,
            maxIems: 1
          }
          )
    ]),
    Section({ title: "auto complete", description: "simple auto complete with default settings" }, [   
        AutoComplete({
          items, 
          id: 'third',
          placeholder: 'select'

        })
    ]),
  ]);
}
