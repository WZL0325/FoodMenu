// 按 20 道菜的关键词映射,从 loremflickr 下载候选图(每菜 1 张,900x600)
import { writeFileSync } from 'node:fs'

const DISHES = [
  { id: 'r001', q: 'broccoli,chickenbowl' },
  { id: 'r002', q: 'tomato,tofu,soup' },
  { id: 'r003', q: 'pumpkin,puree,babyfood' },
  { id: 'r004', q: 'celery,beef,stirfry' },
  { id: 'r005', q: 'shrimp,steamedegg' },
  { id: 'r006', q: 'tofu,mushroom,claypot' },
  { id: 'r007', q: 'steamed,fish' },
  { id: 'r008', q: 'beef,potato,carrot' },
  { id: 'r009', q: 'wood ear salad' },
  { id: 'r010', q: 'shrimp,melonsoup' },
  { id: 'r011', q: 'chicken,salad' },
  { id: 'r012', q: 'carrot,rice,puree' },
  { id: 'r013', q: 'shrimp,scrambledegg' },
  { id: 'r014', q: 'quinoa,vegetable,bowl' },
  { id: 'r015', q: 'sweetpotato,apple,mash' },
  { id: 'r016', q: 'porkribs,soup' },
  { id: 'r017', q: 'egg,sandwich' },
  { id: 'r018', q: 'garlic,spinach' },
  { id: 'r019', q: 'tofu,vegetable,hotpot' },
  { id: 'r020', q: 'broccoli,stirfry' },
]

for (const d of DISHES) {
  const url = `https://loremflickr.com/900/600/${encodeURIComponent(d.q)}?lock=${Number(d.id.slice(1))}`
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(25000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 5000) throw new Error(`too small ${buf.length}`)
    writeFileSync(new URL(`./raw-recipes/${d.id}.jpg`, import.meta.url), buf)
    console.log(`${d.id} OK ${Math.round(buf.length / 1024)}KB`)
  } catch (e) {
    console.error(`${d.id} FAIL ${e.message}`)
  }
}
