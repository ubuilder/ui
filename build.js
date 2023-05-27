//input is docs folder
// output is build folder

import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, writeFileSync} from 'fs'
import { renderScripts, renderTemplate, html, tag } from "@ulibs/router";
import e from 'express';

function compile_page(component) {
    const template = renderTemplate(component)
    const script = renderScripts(component)

    const style = tag('style', {})

    const page = html({
        head: [style],
        body: [template, script]
    })

    return renderTemplate(page)
}

const files = readdirSync('./docs')


if(!existsSync('./build')) {
    mkdirSync('./build')
} else {
    rmSync('./build', {recursive: true})
    mkdirSync('./build')
}



for(let file of files) {
    if(file.endsWith('.js')) {
        import('./docs/' + file).then(module => {
            const page = compile_page(module.default())

            if(file == 'index.js') {
                writeFileSync('./build/' + 'index.html', page)
            } else {

            if(!existsSync('./build/' + file.replace('.js', '') )) {
                mkdirSync('./build/' + file.replace('.js', '') )
            }
            
            writeFileSync('./build/' + file.replace('.js', '') + '/index.html', page)
        }

        })
    }
}