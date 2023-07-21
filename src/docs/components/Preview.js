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
    const code = $props.code
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

        if(!json) return '';

        

        let selfClosing = false
        if(json.tag === 'img') selfClosing = true
        if(json.slots.toString() === '') selfClosing = true
      
        return indent(level) + `&#60${json.tag}${getAttributes(json.props)}${selfClosing ? ' /':''}&#62;\n${selfClosing ? '' : getSlots(json.slots, level + 1)}${selfClosing ? '' :indent(level)}${selfClosing ? '' : '&#60;/'}${selfClosing ? '' : json.tag}${selfClosing ? '' : '&#62;\n'}`
    }

//     <script>
//     function runCode(js) {
//         const code = `
//             import {Button, Container, View} from 'https://unpkg.com/@ulibs/ui@next/src/components/index.js'

//             const data = {name: 'My Name', username: 'My Username', id: 'My ID'}

//             const page = ${js}
//             document.body.innerHTML = page.toString()
//         `

//         const iframe = document.querySelector(`[id="iframe"]`)

//         var html_string = `
//         <!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// <link rel="stylesheet" href="https://unpkg.com/@ulibs/ui@next/dist/styles.css">                                            
// <title>Document</title>
// </head>
// <bo`+ `dy class="${document.body.classList.toString()}">

// <scr`+ `ipt type="module">${code}<\/sc` + `ript></bo` + `dy>
//     </ht`+ `ml>
//         `;

//         iframe.src = "data:text/html;charset=utf-8," + escape(html_string);

//         console.log(iframe.src)

//     }
//     function save(js) {
//         runCode(js)
//     }

//     function fullscreen() {

//     }

// </script>

    
    const html_string = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/@ulibs/ui@next/dist/styles.css">                                            
    <script src="https://unpkg.com/@ulibs/ui@next/dist/ulibs.js"></scr`+`ipt>                                            
    <script type="module">
        import {View, Button, Avatar, Tooltip} from 'https://unpkg.com/@ulibs/ui@next/src/components/index.js'

        const page = ${code.trim()}

        document.body.innerHTML = page.toString()
    </scr`+`ipt>
    <title>Document</title>
</head>
<bo`+`dy></bo`+`dy></ht`+`ml>`

    const src = "data:text/html;charset=utf-8," + escape(html_string);
    

    const iframe = View({tag: 'iframe', w: 100, h: '6xl', frameborder: 0, src})
    
    
    return Tabs([
      TabsList([TabsItem("Preview"), TabsItem("HTML"), TabsItem('JS')]),
      TabsContent([
        TabsPanel([iframe]),
        // TabsPanel([View($props, $slots)]),
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
