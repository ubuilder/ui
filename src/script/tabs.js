import { getAttr, queryAttr, register, removeAttr, setAttr } from "./helpers";


export function Tabs(Alpine) {
    console.log('Tabs Alpine')
    Alpine.directive('tabs', (el, first, second)=>{
        let tabItems = [];
        let tabPanels = [];
        let activeTab  = 0
        console.log('tab', el)
        el.querySelectorAll('[u-tabs-item]').forEach((item) => {

            tabItems.push(item)
            let index = tabItems.indexOf(item)
            if(getAttr(item, 'u-tabs-item-active')){
                activeTab = index
            }
            item.onclick = (event)=>{
                queryAttr(el, 'u-tabs-item-active', (e)=>{
                    removeAttr(e, 'u-tabs-item-active')
                })
                queryAttr(el, 'u-tabs-panel-active', (e)=>{
                    removeAttr(e, 'u-tabs-panel-active')
                })
                setAttr(item, 'u-tabs-item-active', true);
                setAttr(tabPanels[index], 'u-tabs-panel-active', true)
            }
        },);

        el.querySelectorAll('[u-tabs-panel]').forEach(panel => {
            tabPanels.push(panel)
        })
        console.log(activeTab)

        setAttr(tabPanels[activeTab], 'u-tabs-panel-active', true)
        setAttr(tabItems[activeTab], 'u-tabs-item-active', true)
    



    })

    // Alpine.directive('u-tabs-item', (el, {}, {})=>{
    //     tabItems.push(el)
    //     let index = tabItems.indexOf(el)
    //     if(getAttr(el, 'u-tab-item-active')){
    //         activeTab = index
    //     }
    //     el.onclick = (event)=>{
    //         queryAttr($el, 'u-tab-item-active', (e)=>{
    //             removeAttr(e, 'u-tab-item-active')
    //         })
    //         queryAttr($el, 'u-tab-panel-active', (el)=>{
    //             removeAttr(el, 'u-tab-panel-active')
    //         })
    //         setAttr(el, 'u-tab-item-active', true);
    //         setAttr(tabPanels[index], 'u-tab-panel-active', true)
    //     }
    // })

    // Alpine.directive('u-tabs-panel', (el, {}, {})=>{
    //     tabPanels.push(el)
        
    // })

    // setAttr(tabPanels[activeTab], 'u-tab-panel-active', true)
    // setAttr(tabItems[activeTab], 'u-tab-item-active', true)
    
}

