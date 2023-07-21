import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import {defaultKeymap} from "@codemirror/commands"
import { javascript } from '@codemirror/lang-javascript'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import {StateEffect, StateField} from "@codemirror/state"
import {Decoration} from "@codemirror/view"

import {autocompletion} from "@codemirror/autocomplete"

// Our list of completions (can be static, since the editor
/// will do filtering based on context).
const completions = [
    {label: "{{ID}}", type: "constant", info: 'This is help', apply: '{{id}}'},
    {label: "{{Name}}", type: "constant", info: 'This is help', apply: '{{name}}'},
    {label: "{{Username}}", type: "constant", info: 'This is help', apply: '{{username}}'},

]

function myCompletions(context) {
    console.log('completion', context)
  let before = context.matchBefore(/\{\{/)
  // If completion wasn't explicitly started and there
  // is no word before the cursor, don't open completions.

  console.log('completion', {context, before})
  if (!context.explicit && !before) return null

  console.log('here')
  return {
    from: before ? before.from : context.pos,
    options: completions,
    validFor: (text, from, to, state) => console.log({text, from, to, state})
  }
}

export function CodeEditor(Alpine) {

    Alpine.directive('code-editor', (el, {}, {cleanup}) => {
        const lang = el.getAttribute('lang')
        const name = el.getAttribute('name')
        let doc = el.getAttribute('value')
        
        const languages = {
            jsx: javascript({jsx: true}),
            js: javascript(),
            ts: javascript({typescript: true}),
            css: css(),
            html: html({autoCloseTags: true})
        }

        const onUpdate = (tr, view) => {
            if(doc !== view.state.doc.toString()) {
                doc = view.state.doc.toString()
                Alpine.$data(el)[name] = doc
            }
            view.update([tr])
        }
        
        const editor = new EditorView({
            doc,
            dispatch: onUpdate,
            extensions: [
                keymap.of(defaultKeymap), 
                lineNumbers(), 
                languages[lang] ?? languages['js'], // default language is js
                autocompletion({override: [myCompletions]}),
                
            ],
            parent: el
        })

        cleanup(() => {
            editor.destroy()

        })            
    })
}