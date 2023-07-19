import { Button } from "../../components/Button.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Tabs, TabsList, TabsPanel, TabsItem, TabsContent } from "../../components/index.js";

export default function () {
  return DocPage({ name: "Tabs" }, [
    Section({ title: "tabs", description: "the default active tabs is tabs one if not specified" }, [
        Tabs({}, 
            [
                TabsList({},
                    [
                        TabsItem('tabs1'),
                        TabsItem('tabs2'),
                        TabsItem('tabs3'),
                    ]
                ),
                TabsContent({}, 
                    [
                        TabsPanel({}, 'this is tabs panel for tabs1'),
                        TabsPanel({}, 'this is tabs panel for tabs2'),
                        TabsPanel({}, 'this is tabs panel for tabs3'),
                    ]
                )
        ])
    ]),
    Section({ title: "tabs", description: "active tabs3" }, [
        Tabs({}, 
            [
                TabsList({},
                    [
                        TabsItem('tabs1'),
                        TabsItem('tabs2'),
                        TabsItem({active: true},'tabs3'),
                    ]
                ),
                TabsContent({}, 
                    [
                        TabsPanel({}, 'this is tabs panel for tabs1'),
                        TabsPanel({}, 'this is tabs panel for tabs2'),
                        TabsPanel({}, 'this is tabs panel for tabs3'),
                    ]
                )
            ]
            )

      
    ]),
    Section({ title: "tabs", description: "active tabs 1" }, [
        Tabs({}, 
            [
                TabsList({},
                    [
                        TabsItem({active: true}, 'tabs1'),
                        TabsItem('tabs2'),
                        TabsItem('tabs3'),
                    ]
                ),
                TabsContent({}, 
                    [
                        TabsPanel({}, 'this is tabs panel for tabs1'),
                        TabsPanel({}, 'this is tabs panel for tabs2'),
                        TabsPanel({}, 'this is tabs panel for tabs3'),
                    ]
                )
            ]
            )
    ]),
  ]);
}
