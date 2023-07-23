
const myCode = `Icon('user')`

const components = 'Icon, View';

import { Icon } from './src/components/index.js'

const run = new Function(` const page = ${myCode}; console.log(page)`)


const res = run()

console.log(res)