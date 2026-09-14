// 渲染 Lucide 图标为 tabBar PNG(81x81,暖灰/品牌橙两态)
import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const TABS = [
  { name: 'index', icon: 'utensils' },
  { name: 'recommend', icon: 'book-open' },
  { name: 'me', icon: 'user-round' },
]
const STATES = [
  { suffix: '', color: '#8F8A97' },
  { suffix: '-active', color: '#F45B3C' },
]

for (const tab of TABS) {
  const raw = readFileSync(new URL(`../node_modules/lucide-static/icons/${tab.icon}.svg`, import.meta.url), 'utf8')
  for (const state of STATES) {
    const svg = raw
      .replace(/\s(width|height)="24"/g, '')
      .replace('<svg', '<svg width="81" height="81"')
      .replace('stroke="currentColor"', `stroke="${state.color}"`)
    const png = new Resvg(svg, { background: 'rgba(0,0,0,0)' }).render().asPng()
    writeFileSync(new URL(`../src/static/tabbar/${tab.name}${state.suffix}.png`, import.meta.url), png)
  }
}
console.log('OK 6 tabbar png')
