import {
  View,
  Tabs,
  TabsPanel,
  TabsList,
  TabsContent,
  TabsItem,
} from "../../components/index.js";
import { Base } from "../../utils.js";

export const Preview = Base({
  render($props, $slots) {
    function indent(level) {
        return Array.from({length: level+1}).join('  ')
    }

    function getSlots(slots, level) {
        return getHTMLCode(slots, level)
    }

    function getAttributes(obj) {
        let result = ''
        for(let key in obj) {
            if(obj[key] === '' || obj[key] === true) {
                result += ' ' + key;

            } else {
                result += ' ' + key + '=' + '"' + obj[key] + '"'

            }
        }
        return result;
    }
    
    function getHTMLCode(json, level = 0) {
        if(Array.isArray(json)) {
            return json.map(item => getHTMLCode(item, level)).join('')
        }

        if(typeof json === 'string') return indent(level) + json + '\n';

        let selfClosing = false
        if(json.tag === 'img') selfClosing = true
        if($slots.length === 0) selfClosing = true
      
        return indent(level) + `&#60${json.tag}${getAttributes(json.props)}${selfClosing ? '/':''}&#62;\n${selfClosing ? '' : getSlots(json.slots, level + 1)}${selfClosing ? '' :indent(level)}${selfClosing ? '' : '&#60;/'}${selfClosing ? '' : json.tag}${selfClosing ? '' : '&#62;\n'}`
    }

    
    return Tabs([
      TabsList([TabsItem("Preview"), TabsItem("HTML"), TabsItem('JS')]),
      TabsContent([
        TabsPanel([View($props, $slots)]),
        TabsPanel([
          View({ tag: "pre", style: 'font-size: var(--size-xs); line-height: var(--size-sm); overflow: auto' }, [
            View({ tag: "code" }, [
                getHTMLCode($slots)
            //   $slots
            //     .join("\n")
            //     .replace(/</g, "\n&#60;")
            //     .replace(/>/g, "&#62;\n\t"),
            ]),
        ]),
    ]),
    $props.code && TabsPanel([
        View({ tag: "pre", style: 'font-size: var(--size-xs); line-height: var(--size-sm); overflow: auto' }, [
            View({ tag: "code" }, [
                $props.code
            ]),
        ]),
        ]),
      ]),
    ]);
  },
});
