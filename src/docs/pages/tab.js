import { Button } from "../../components/Button.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Tab, TabList, TabPanel, TabItem, TabContent } from "../../components/Tab.js";

export default function () {
  return DocPage({ name: "Tabs" }, [
    Section({ title: "tab", description: "the default active tab is tab one if not specified" }, [
        Tab({}, 
            [
                TabList({},
                    [
                        TabItem('tab1'),
                        TabItem('tab2'),
                        TabItem('tab3'),
                    ]
                ),
                TabContent({}, 
                    [
                        TabPanel({}, 'this is tab panel for tab1'),
                        TabPanel({}, 'this is tab panel for tab2'),
                        TabPanel({}, 'this is tab panel for tab3'),
                    ]
                )
            ]
            )

      
    ]),
    Section({ title: "tab", description: "active tab3" }, [
        Tab({}, 
            [
                TabList({},
                    [
                        TabItem('tab1'),
                        TabItem('tab2'),
                        TabItem({active: true},'tab3'),
                    ]
                ),
                TabContent({}, 
                    [
                        TabPanel({}, 'this is tab panel for tab1'),
                        TabPanel({}, 'this is tab panel for tab2'),
                        TabPanel({}, 'this is tab panel for tab3'),
                    ]
                )
            ]
            )

      
    ]),
    Section({ title: "tab", description: "active tab 1" }, [
        Tab({}, 
            [
                TabList({},
                    [
                        TabItem({active: true}, 'tab1'),
                        TabItem('tab2'),
                        TabItem('tab3'),
                    ]
                ),
                TabContent({}, 
                    [
                        TabPanel({}, 'this is tab panel for tab1'),
                        TabPanel({}, 'this is tab panel for tab2'),
                        TabPanel({}, 'this is tab panel for tab3'),
                    ]
                )
            ]
            )

      
    ]),
  ]);
}
