import { getAttr, queryAttr, register, removeAttr, setAttr } from "./helpers";

export function Tab($el) {
    let tabItems = [];
    let tabPanels = [];
    let activeTab  = 0

    queryAttr($el, 'u-tab-list',    (el)=>{

    })
    queryAttr($el, 'u-tab-content', (el)=>{

    })
    queryAttr($el, 'u-tab-item',    (el)=>{
        tabItems.push(el)
        let index = tabItems.indexOf(el)
        if(getAttr(el, 'u-tab-item-active')){
            activeTab = index
        }
        el.onclick = (event)=>{
            queryAttr($el, 'u-tab-item-active', (e)=>{
                removeAttr(e, 'u-tab-item-active')
            })
            queryAttr($el, 'u-tab-panel-active', (el)=>{
                removeAttr(el, 'u-tab-panel-active')
            })
            setAttr(el, 'u-tab-item-active', true);
            setAttr(tabPanels[index], 'u-tab-panel-active', true)
        }

    })
    queryAttr($el, 'u-tab-panel',   (el)=>{
        tabPanels.push(el)

    })
    setAttr(tabPanels[activeTab], 'u-tab-panel-active', true)
    setAttr(tabItems[activeTab], 'u-tab-item-active', true)
    
}
register("u-tab", Tab);
