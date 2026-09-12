// 从 node_modules/lucide-static 重新生成 src/components/AppIcon/icons.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const NAMES = [
  'search','x','check','plus','minus','heart','refresh-cw','chevron-right','chevron-down','chevron-left',
  'arrow-right','arrow-left','clock','flame','calendar','shopping-basket','trash-2','info','triangle-alert','leaf',
  'utensils','sparkles','book-open','user-round','rotate-ccw','external-link','image-off','camera','check-check','circle-check',
  'circle-x','bell','apple','wheat','egg','fish','carrot','drumstick','soup','salad',
  'sandwich','clipboard-list','calendar-plus','share-2','folder-heart',
]

const lines = ['// 由 scripts/gen-appicon.mjs 从 lucide-static(ISC) 生成,勿手改', 'export const lucideIcons: Record<string, string> = {']
for (const name of NAMES) {
  const p = new URL(`../node_modules/lucide-static/icons/${name}.svg`, import.meta.url)
  if (!existsSync(p)) throw new Error(`missing icon: ${name}`)
  const svg = readFileSync(p, 'utf8')
  const inner = []
  for (const m of svg.matchAll(/<path[^>]*d="([^"]+)"[^>]*\/>/g)) inner.push(`<path d="${m[1]}"/>`)
  for (const m of svg.matchAll(/<circle[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*r="([^"]+)"[^>]*\/>/g)) inner.push(`<circle cx="${m[1]}" cy="${m[2]}" r="${m[3]}"/>`)
  for (const m of svg.matchAll(/<rect[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*width="([^"]+)"[^>]*height="([^"]+)"[^>]*(?:rx="([^"]+)")?[^>]*\/>/g)) inner.push(`<rect x="${m[1]}" y="${m[2]}" width="${m[3]}" height="${m[4]}" rx="${m[5] ?? 0}"/>`)
  lines.push(`  ${JSON.stringify(name)}: ${JSON.stringify(inner.join(''))},`)
}
lines.push('}')
writeFileSync(new URL('../src/components/AppIcon/icons.ts', import.meta.url), lines.join('\n') + '\n')
console.log(`OK ${NAMES.length} icons`)
