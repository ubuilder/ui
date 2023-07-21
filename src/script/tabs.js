import { getAttr, queryAttr, register, removeAttr, setAttr } from "./helpers";


export function Tabs(Alpine) {
    Alpine.directive('tabs', (el, first, second)=>{
        let tabItems = [];
        let tabPanels = [];
        let activeTab  = 0

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

        
        setAttr(tabPanels[activeTab], 'u-tabs-panel-active', true)
        setAttr(tabItems[activeTab], 'u-tabs-item-active', true)
    



    })
}

