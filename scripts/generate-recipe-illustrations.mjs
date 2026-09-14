// 为 30 道本地菜谱生成确定性的年轻插画风封面（800×533 progressive JPEG）
// 运行：node scripts/generate-recipe-illustrations.mjs
// 产物：src/static/recipes/r001.jpg – r030.jpg
// 规则：浅色背景 + 居中餐具（70% 安全区）+ 与菜名对应的食材图形；
//       无文字、无水印；生成后强制校验内容哈希唯一。
import { createHash } from 'node:crypto'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const OUT_DIR = path.resolve('src/static/recipes')
const WIDTH = 800
const HEIGHT = 533

// —— 调色板（与「活力橙绿」视觉方案一致）——
const C = {
  orange: '#F45B3C',
  deepOrange: '#C83D2C',
  green: '#56A968',
  berry: '#D94B71',
  // 食材色
  tomato: '#E8563F',
  tomatoLight: '#F58A6E',
  pumpkin: '#F5A623',
  pumpkinLight: '#FBD186',
  yolk: '#F7C948',
  tofu: '#FDF3E3',
  tofuLight: '#FFFDF6',
  tofuDark: '#EAD3AE',
  beef: '#B5714B',
  beefLight: '#CE8F66',
  chicken: '#E4B77E',
  chickenLight: '#F2D9B0',
  shrimp: '#F58A6E',
  shrimpLight: '#FBC0AE',
  greenDark: '#2F7A44',
  greenMid: '#3F8A52',
  noodle: '#F3D27A',
  cream: '#FBF4E6',
  white: '#FFFDF6',
}

const mix = (hexA, hexB, ratio) => {
  const parse = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const [a, b] = [parse(hexA), parse(hexB)]
  const ch = a.map((v, i) => Math.round(v + (b[i] - v) * ratio))
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

// —— 食材图形（基准尺寸约 52px，scale 缩放；opts 支持 rot/flip）——
const wrap = (x, y, s, o = {}, inner) =>
  `<g transform="translate(${x} ${y}) rotate(${o.rot ?? 0}) scale(${o.flip ? -s : s} ${s})">${inner}</g>`

const G = {
  slice: (x, y, s, o = {}) =>
    wrap(x, y, s, o, `<circle r="26" fill="${o.fill ?? C.pumpkin}"/><circle r="14" fill="${o.inner ?? C.pumpkinLight}"/>`),
  strip: (x, y, s, o = {}) =>
    wrap(
      x,
      y,
      s,
      o,
      `<rect x="-32" y="-11" width="64" height="22" rx="11" fill="${o.fill ?? C.beef}"/>` +
        `<rect x="-24" y="-5" width="44" height="10" rx="5" fill="${o.inner ?? C.beefLight}"/>`,
    ),
  cube: (x, y, s, o = {}) => {
    const main = o.fill ?? C.tofu
    const light = o.inner ?? C.tofuLight
    const dark = o.dark ?? C.tofuDark
    return wrap(
      x,
      y,
      s,
      o,
      `<path d="M -24 -10 L 0 -22 L 24 -10 L 0 2 Z" fill="${light}"/>` +
        `<path d="M -24 -10 L 0 2 L 0 26 L -24 14 Z" fill="${main}"/>` +
        `<path d="M 24 -10 L 0 2 L 0 26 L 24 14 Z" fill="${dark}"/>`,
    )
  },
  blob: (x, y, s, o = {}) => {
    const d =
      'M -22 -6 C -28 -20 -6 -28 5 -21 C 19 -25 27 -10 20 1 C 24 13 5 23 -6 16 C -21 18 -28 3 -22 -6 Z'
    return wrap(x, y, s, o, `<path d="${d}" fill="${o.fill ?? C.white}"/>`)
  },
  dots: (x, y, s, o = {}) => {
    const offsets = [
      [-26, 6],
      [0, -12],
      [24, 8],
      [-6, 18],
      [10, -2],
    ]
    const colors = o.colors ?? ['#F5C542']
    const r = o.r ?? 6
    return wrap(
      x,
      y,
      s,
      o,
      offsets
        .map(([dx, dy], i) => `<circle cx="${dx}" cy="${dy}" r="${r}" fill="${colors[i % colors.length]}"/>`)
        .join(''),
    )
  },
  broccoli: (x, y, s, o = {}) =>
    wrap(
      x,
      y,
      s,
      o,
      `<rect x="-9" y="4" width="18" height="24" rx="8" fill="#9CC489"/>` +
        `<circle cx="-19" cy="-6" r="15" fill="${C.greenMid}"/>` +
        `<circle cx="19" cy="-6" r="15" fill="${C.greenMid}"/>` +
        `<circle cx="0" cy="-16" r="18" fill="#4C9E5F"/>` +
        `<circle cx="-8" cy="-8" r="3" fill="#6FBF7F"/><circle cx="10" cy="-12" r="3" fill="#6FBF7F"/>`,
    ),
  mushroom: (x, y, s, o = {}) =>
    wrap(
      x,
      y,
      s,
      o,
      `<rect x="-9" y="2" width="18" height="20" rx="8" fill="#F5EAD3"/>` +
        `<path d="M -26 2 A 26 22 0 0 1 26 2 L -26 2 Z" fill="#B5714B"/>` +
        `<ellipse cx="-8" cy="-7" rx="10" ry="6" fill="#CE8F66"/>`,
    ),
  shrimp: (x, y, s, o = {}) => {
    const main = o.fill ?? C.shrimp
    return wrap(
      x,
      y,
      s,
      o,
      `<path d="M -20 10 A 21 21 0 1 1 20 10" fill="none" stroke="${main}" stroke-width="13" stroke-linecap="round"/>` +
        `<path d="M -14 4 A 15 15 0 0 1 14 4" fill="none" stroke="${C.shrimpLight}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M 20 10 L 33 19 L 28 3 Z" fill="${main}"/>`,
    )
  },
  fish: (x, y, s, o = {}) =>
    wrap(
      x,
      y,
      s,
      o,
      `<path d="M -38 0 C -26 -16 4 -18 18 -6 C 22 -2 22 2 18 6 C 4 18 -26 16 -38 0 Z" fill="${o.fill ?? '#C7DEEF'}"/>` +
        `<path d="M 16 0 L 34 -13 L 30 0 L 34 13 Z" fill="${o.fill ?? '#C7DEEF'}"/>` +
        `<path d="M -6 -10 q 8 10 0 20" stroke="rgba(255,255,255,0.6)" stroke-width="3" fill="none" stroke-linecap="round"/>` +
        `<circle cx="-25" cy="-3" r="3" fill="rgba(36,33,42,0.5)"/>`,
    ),
  leaf: (x, y, s, o = {}) =>
    wrap(
      x,
      y,
      s,
      o,
      `<path d="M 0 -24 C 17 -13 17 12 0 24 C -17 12 -17 -13 0 -24 Z" fill="${o.fill ?? C.green}"/>` +
        `<path d="M 0 -16 L 0 16" stroke="rgba(255,255,255,0.55)" stroke-width="3" stroke-linecap="round"/>`,
    ),
  woodEar: (x, y, s, o = {}) =>
    wrap(
      x,
      y,
      s,
      o,
      `<path d="M -26 8 A 26 24 0 0 1 26 8 L 12 8 A 12 11 0 0 0 -12 8 Z" fill="#4E3A47"/>` +
        `<path d="M -12 8 A 12 11 0 0 1 12 8 Z" fill="#6E5060"/>`,
    ),
  onionArc: (x, y, s, o = {}) =>
    wrap(
      x,
      y,
      s,
      o,
      `<path d="M -22 12 A 22 22 0 0 1 22 12" fill="none" stroke="#B79BD6" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M -12 12 A 12 12 0 0 1 12 12" fill="none" stroke="#D5C2E8" stroke-width="6" stroke-linecap="round"/>`,
    ),
  eggSun: (x, y, s, o = {}) => {
    const d =
      'M -22 -6 C -28 -20 -6 -28 5 -21 C 19 -25 27 -10 20 1 C 24 13 5 23 -6 16 C -21 18 -28 3 -22 -6 Z'
    return wrap(
      x,
      y,
      s,
      o,
      `<path d="${d}" fill="${C.white}"/>${o.noYolk ? '' : `<circle r="9" fill="${C.yolk}"/>`}`,
    )
  },
  noodle: (x, y, s, o = {}) =>
    wrap(
      x,
      y,
      s,
      o,
      `<g stroke="${C.noodle}" stroke-width="9" fill="none" stroke-linecap="round">` +
        `<path d="M -74 0 q 18 -14 37 0 t 37 0 t 37 0"/>` +
        `<path d="M -60 14 q 16 -12 32 0 t 32 0 t 32 0"/>` +
        `<path d="M -66 -14 q 18 -12 36 0 t 36 0"/>` +
        `</g>`,
    ),
  fillet: (x, y, s, o = {}) =>
    wrap(
      x,
      y,
      s,
      o,
      `<rect x="-80" y="-42" width="160" height="84" rx="36" fill="#FDF6EC" stroke="#EAD9C3" stroke-width="3"/>` +
        `<path d="M -44 -8 q 22 20 44 0" stroke="#E8D5BC" stroke-width="6" fill="none" stroke-linecap="round"/>` +
        `<path d="M 6 -2 q 22 20 44 0" stroke="#E8D5BC" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    ),
  wedge: (x, y, s, o = {}) =>
    wrap(
      x,
      y,
      s,
      o,
      `<path d="M -26 16 L 0 -24 L 26 16 Z" fill="${C.pumpkin}" stroke="#E08E1B" stroke-width="4" stroke-linejoin="round"/>` +
        `<path d="M -12 10 L 0 -10 L 12 10 Z" fill="${C.pumpkinLight}"/>`,
    ),
}

// —— 餐具 ——
const plateSvg = (accent, shadow) =>
  `<ellipse cx="400" cy="330" rx="252" ry="104" fill="${shadow}"/>` +
  `<ellipse cx="400" cy="312" rx="255" ry="115" fill="#FFFFFF"/>` +
  `<ellipse cx="400" cy="306" rx="205" ry="86" fill="#FBF4EA"/>` +
  `<ellipse cx="400" cy="306" rx="205" ry="86" fill="none" stroke="${accent}" stroke-opacity="0.25" stroke-width="3"/>`

const bowlSvg = (accent, surface, shadow) =>
  `<ellipse cx="400" cy="322" rx="235" ry="86" fill="${shadow}"/>` +
  `<rect x="352" y="488" width="96" height="22" rx="11" fill="${mix('#FFFFFF', accent, 0.3)}"/>` +
  `<path d="M 150 300 A 250 205 0 0 0 650 300 Z" fill="#FFFFFF"/>` +
  `<ellipse cx="400" cy="300" rx="250" ry="62" fill="#FFFFFF"/>` +
  `<ellipse cx="400" cy="299" rx="222" ry="50" fill="${surface}"/>` +
  `<ellipse cx="400" cy="299" rx="222" ry="50" fill="none" stroke="${accent}" stroke-opacity="0.22" stroke-width="3"/>`

const potSvg = (accent, surface, shadow) =>
  `<ellipse cx="400" cy="332" rx="228" ry="88" fill="${shadow}"/>` +
  `<rect x="88" y="290" width="72" height="30" rx="15" fill="${mix('#FFFFFF', accent, 0.35)}"/>` +
  `<rect x="640" y="290" width="72" height="30" rx="15" fill="${mix('#FFFFFF', accent, 0.35)}"/>` +
  `<circle cx="400" cy="306" r="180" fill="#FFFFFF"/>` +
  `<circle cx="400" cy="302" r="152" fill="${surface}"/>` +
  `<circle cx="400" cy="306" r="180" fill="none" stroke="${accent}" stroke-opacity="0.28" stroke-width="4"/>`

const jarSvg = (id, accent) => {
  const layers =
    `<rect x="302" y="352" width="196" height="86" fill="#8A5FA8"/>` +
    `<rect x="302" y="272" width="196" height="80" fill="#FFF9F0"/>` +
    `<rect x="302" y="240" width="196" height="32" fill="${C.noodle}"/>`
  return (
    `<defs><clipPath id="jar-${id}"><rect x="300" y="168" width="200" height="270" rx="30"/></clipPath></defs>` +
    `<ellipse cx="400" cy="448" rx="130" ry="26" fill="${mix('#FFF0F4', '#24212A', 0.08)}"/>` +
    `<rect x="300" y="168" width="200" height="270" rx="30" fill="#FFFFFF" opacity="0.6"/>` +
    `<g clip-path="url(#jar-${id})">${layers}</g>` +
    `<rect x="300" y="168" width="200" height="270" rx="30" fill="none" stroke="#E8D9CE" stroke-width="4"/>` +
    `<rect x="318" y="188" width="18" height="220" rx="9" fill="#FFFFFF" opacity="0.55"/>` +
    `<circle cx="356" cy="226" r="15" fill="${C.berry}"/><circle cx="402" cy="214" r="17" fill="#C83D6B"/>` +
    `<circle cx="444" cy="230" r="13" fill="${C.berry}"/>` +
    `<circle cx="380" cy="222" r="4" fill="#FFE6ED"/><circle cx="426" cy="222" r="4" fill="#FFE6ED"/>` +
    `<g transform="translate(452 200) scale(0.5)"><path d="M 0 -24 C 17 -13 17 12 0 24 C -17 12 -17 -13 0 -24 Z" fill="${C.green}"/></g>`
  )
}

// 顶部研究：主餐区之上的白色蒸汽
const steamSvg = (count, baseY) => {
  const xs = [364, 400, 436].slice(0, count)
  return xs
    .map(
      (cx, i) =>
        `<path d="M ${cx} ${baseY} C ${cx - 12} ${baseY - 16}, ${cx + 12} ${baseY - 30}, ${cx} ${
          baseY - (i === 1 ? 56 : 44)
        }" stroke="rgba(255,255,255,0.9)" stroke-width="9" fill="none" stroke-linecap="round"/>`,
    )
    .join('')
}

const decoSvg = (accent) =>
  `<circle cx="118" cy="112" r="10" fill="${accent}" opacity="0.32"/>` +
  `<rect x="662" y="94" width="34" height="8" rx="4" fill="${C.berry}" opacity="0.28"/>` +
  `<rect x="675" y="81" width="8" height="34" rx="4" fill="${C.berry}" opacity="0.28"/>` +
  `<circle cx="128" cy="420" r="8" fill="${C.berry}" opacity="0.3"/>` +
  `<g opacity="0.4" transform="translate(664 412) scale(0.5) rotate(24)"><path d="M 0 -24 C 17 -13 17 12 0 24 C -17 12 -17 -13 0 -24 Z" fill="${accent}"/></g>`

// —— 30 道菜的插画规格 ——
const SPECS = [
  // r001 西兰花鸡胸肉轻食碗
  { id: 'r001', bg: '#FFF1E2', accent: C.orange, vessel: 'bowl', surface: '#F7ECD7', steam: 2,
    items: [['broccoli', 322, 276, 1], ['strip', 452, 266, 0.95, { fill: C.chicken, inner: C.chickenLight, rot: -16 }],
      ['strip', 506, 296, 0.8, { fill: C.chicken, inner: C.chickenLight, rot: 12 }],
      ['slice', 368, 318, 0.7], ['dots', 430, 316, 1, { colors: [C.green, C.pumpkin, C.berry], r: 5 }]] },
  // r002 番茄豆腐菌菇汤
  { id: 'r002', bg: '#FDF0E8', accent: C.orange, vessel: 'bowl', surface: '#F6DCC0', steam: 3,
    items: [['slice', 322, 296, 0.95, { fill: C.tomato, inner: C.tomatoLight }],
      ['slice', 372, 318, 0.72, { fill: C.tomato, inner: C.tomatoLight }],
      ['cube', 458, 290, 0.95], ['cube', 506, 312, 0.7], ['mushroom', 416, 272, 0.85]] },
  // r003 南瓜鳕鱼泥（婴儿辅食）
  { id: 'r003', bg: '#F3F8EA', accent: C.green, vessel: 'bowl', surface: '#F8C77E', steam: 2,
    items: [['fish', 400, 292, 0.7, { fill: '#FBEFD9' }],
      ['dots', 352, 306, 1, { colors: ['#FBEFD9'], r: 4 }],
      ['dots', 452, 304, 1, { colors: ['#FBEFD9'], r: 4 }]] },
  // r004 芹菜牛肉丝
  { id: 'r004', bg: '#FFF1E2', accent: C.orange, vessel: 'plate', steam: 0,
    items: [['strip', 338, 272, 0.95, { rot: -18 }], ['strip', 438, 258, 0.9, { rot: 8 }],
      ['strip', 530, 300, 0.85, { rot: -6 }],
      ['strip', 368, 330, 0.9, { fill: C.green, inner: '#8CC49A', rot: 14 }],
      ['strip', 470, 332, 0.8, { fill: C.green, inner: '#8CC49A', rot: -8 }],
      ['onionArc', 540, 252, 0.8]] },
  // r005 虾仁蒸蛋羹
  { id: 'r005', bg: '#FFF6E8', accent: C.orange, vessel: 'bowl', surface: C.yolk, steam: 3,
    items: [['shrimp', 352, 290, 0.95], ['shrimp', 456, 286, 0.9, { flip: true }],
      ['dots', 408, 314, 1, { colors: [C.green], r: 5 }]] },
  // r006 菠菜香菇豆腐煲
  { id: 'r006', bg: '#F2F8EC', accent: C.green, vessel: 'bowl', surface: '#EAF0D8', steam: 3,
    items: [['leaf', 330, 292, 0.9, { fill: C.greenMid }], ['leaf', 372, 318, 0.75, { fill: C.greenMid }],
      ['cube', 452, 288, 0.9], ['cube', 498, 312, 0.68], ['mushroom', 414, 270, 0.8]] },
  // r007 清蒸鲈鱼
  { id: 'r007', bg: '#FDF1E5', accent: C.orange, vessel: 'plate', steam: 3,
    items: [['fish', 398, 286, 1.55],
      ['strip', 338, 330, 0.62, { fill: C.green, inner: '#8CC49A', rot: 6 }],
      ['strip', 452, 332, 0.62, { fill: C.green, inner: '#8CC49A', rot: -6 }],
      ['strip', 524, 268, 0.55, { fill: '#F2E3B8', inner: '#FAF0D2', rot: 18 }]] },
  // r008 土豆胡萝卜牛肉粒
  { id: 'r008', bg: '#FFF3E0', accent: C.orange, vessel: 'plate', steam: 0,
    items: [['cube', 344, 268, 0.95, { fill: '#F3E3B8', inner: '#FBF1D6', dark: '#E3CE9C' }],
      ['cube', 398, 300, 0.8, { fill: '#F3E3B8', inner: '#FBF1D6', dark: '#E3CE9C' }],
      ['cube', 462, 266, 0.85, { fill: C.pumpkin, inner: C.pumpkinLight, dark: '#E08E1B' }],
      ['cube', 508, 300, 0.68, { fill: C.pumpkin, inner: C.pumpkinLight, dark: '#E08E1B' }],
      ['cube', 432, 330, 0.9, { fill: C.beef, inner: C.beefLight, dark: '#8F5232' }]] },
  // r009 凉拌木耳
  { id: 'r009', bg: '#F4F9EF', accent: C.green, vessel: 'plate', steam: 0,
    items: [['woodEar', 352, 274, 1], ['woodEar', 432, 262, 0.85], ['woodEar', 402, 322, 0.9],
      ['slice', 486, 300, 0.85, { fill: '#8CC49A', inner: '#DFF2E2' }],
      ['slice', 528, 266, 0.68, { fill: '#8CC49A', inner: '#DFF2E2' }],
      ['strip', 300, 312, 0.55, { fill: C.pumpkin, inner: C.pumpkinLight, rot: 24 }]] },
  // r010 冬瓜虾仁汤
  { id: 'r010', bg: '#FFF4EA', accent: C.orange, vessel: 'bowl', surface: '#F3EAD8', steam: 3,
    items: [['strip', 344, 286, 0.9, { fill: '#DDEBD3', inner: '#F0F7EA', rot: -14 }],
      ['strip', 436, 276, 0.85, { fill: '#DDEBD3', inner: '#F0F7EA', rot: 10 }],
      ['shrimp', 512, 298, 0.85], ['dots', 398, 318, 1, { colors: [C.green], r: 5 }]] },
  // r011 鸡胸肉沙拉
  { id: 'r011', bg: '#F0F7EA', accent: C.green, vessel: 'bowl', surface: '#F2F7E2', steam: 0,
    items: [['leaf', 336, 282, 1], ['leaf', 470, 302, 0.8],
      ['strip', 404, 268, 0.9, { fill: C.chicken, inner: C.chickenLight, rot: -12 }],
      ['slice', 522, 286, 0.72, { fill: C.tomato, inner: C.tomatoLight }],
      ['dots', 352, 320, 1, { colors: ['#F5C542'], r: 6 }]] },
  // r012 胡萝卜米糊（婴儿辅食）
  { id: 'r012', bg: '#FFF6E9', accent: C.green, vessel: 'bowl', surface: '#F9D9A8', steam: 2,
    items: [['slice', 400, 292, 0.5]] },
  // r013 蛋白炒虾仁
  { id: 'r013', bg: '#FFF2E4', accent: C.orange, vessel: 'plate', steam: 0,
    items: [['eggSun', 352, 278, 1, { noYolk: true }], ['eggSun', 458, 302, 0.85, { noYolk: true }],
      ['shrimp', 408, 262, 0.9], ['shrimp', 512, 290, 0.8, { flip: true }],
      ['dots', 330, 322, 1, { colors: ['#8CC49A'], r: 5 }]] },
  // r014 藜麦时蔬碗
  { id: 'r014', bg: '#FFF5E6', accent: C.green, vessel: 'bowl', surface: '#FAF2E0', steam: 0,
    items: [['dots', 356, 302, 1, { colors: ['#E8C26A', C.pumpkin, C.berry], r: 5 }],
      ['broccoli', 456, 272, 0.85], ['slice', 326, 276, 0.68, { fill: C.tomato, inner: C.tomatoLight }],
      ['dots', 506, 312, 1, { colors: ['#F5C542'], r: 6 }], ['onionArc', 424, 322, 0.6]] },
  // r015 苹果红薯泥（婴儿辅食）
  { id: 'r015', bg: '#FDF3EC', accent: C.berry, vessel: 'bowl', surface: '#F5C08B', steam: 2,
    items: [['slice', 456, 290, 0.62, { fill: '#F7E8C8', inner: '#FBF3DC' }]],
    extrasBefore: `<path d="M 320 292 q 40 -26 80 0 t 80 0" stroke="#FBDCA8" stroke-width="10" fill="none" stroke-linecap="round"/>` },
  // r016 山药排骨汤
  { id: 'r016', bg: '#FFF3E6', accent: C.orange, vessel: 'bowl', surface: '#F5E7CD', steam: 3,
    items: [['strip', 352, 286, 0.95, { rot: -10 }],
      ['cube', 452, 272, 0.85, { fill: '#FBF4E6', inner: '#FFFDF6', dark: '#EADFC8' }],
      ['cube', 494, 306, 0.66, { fill: '#FBF4E6', inner: '#FFFDF6', dark: '#EADFC8' }],
      ['dots', 404, 316, 1, { colors: [C.berry], r: 5 }]] },
  // r017 鸡蛋三明治
  { id: 'r017', bg: '#FFF0F3', accent: C.berry, vessel: 'plate', steam: 0, items: [],
    extrasBefore:
      `<path d="M 280 322 L 400 202 L 520 322 Z" fill="#F2C879" stroke="#F2C879" stroke-width="18" stroke-linejoin="round"/>` +
      `<path d="M 340 262 L 400 224 L 460 262 Z" fill="#F9E3B8"/>` +
      `<circle cx="392" cy="240" r="4" fill="#FFFDF6"/><circle cx="412" cy="252" r="4" fill="#FFFDF6"/>`,
    extras:
      `<rect x="318" y="268" width="164" height="13" rx="6" fill="#8CC49A"/>` +
      `<rect x="300" y="286" width="200" height="12" rx="6" fill="#FFF6E0"/>` +
      `<rect x="288" y="303" width="224" height="12" rx="6" fill="${C.tomato}"/>` },
  // r018 蒜蓉菠菜
  { id: 'r018', bg: '#F1F8ED', accent: C.green, vessel: 'plate', steam: 2,
    items: [['leaf', 352, 282, 1.05, { fill: C.greenDark }], ['leaf', 448, 302, 0.9, { fill: C.greenDark }],
      ['leaf', 402, 258, 0.8, { fill: C.greenMid }],
      ['dots', 506, 272, 1, { colors: ['#FBF4E6'], r: 5 }]] },
  // r019 杂菜豆腐锅
  { id: 'r019', bg: '#FDF1E3', accent: C.orange, vessel: 'pot', surface: '#F7E1B8', steam: 2,
    items: [['cube', 358, 272, 0.8], ['cube', 468, 318, 0.72], ['mushroom', 422, 266, 0.78],
      ['mushroom', 334, 322, 0.7], ['slice', 498, 272, 0.68, { fill: C.tomato, inner: C.tomatoLight }],
      ['dots', 392, 322, 1, { colors: ['#F5C542'], r: 6 }]] },
  // r020 清炒西兰花
  { id: 'r020', bg: '#F2F8EE', accent: C.green, vessel: 'plate', steam: 2,
    items: [['broccoli', 342, 278, 1.05], ['broccoli', 444, 262, 0.9], ['broccoli', 402, 322, 0.95],
      ['slice', 516, 292, 0.68], ['dots', 474, 326, 1, { colors: ['#FBF4E6'], r: 4 }]] },
  // r021 虾仁西兰花藜麦碗
  { id: 'r021', bg: '#FFF2E2', accent: C.orange, vessel: 'bowl', surface: '#FAF2E0', steam: 2,
    items: [['shrimp', 352, 286, 0.9], ['broccoli', 456, 276, 0.85],
      ['dots', 410, 318, 1, { colors: ['#E8C26A', C.green], r: 5 }],
      ['strip', 508, 302, 0.7, { fill: C.pumpkin, inner: C.pumpkinLight, rot: -18 }]] },
  // r022 香菇鸡丝拌面
  { id: 'r022', bg: '#FFF4E8', accent: C.orange, vessel: 'bowl', surface: '#F6E3C4', steam: 3,
    items: [['noodle', 400, 298, 1], ['strip', 352, 274, 0.7, { fill: C.chicken, inner: C.chickenLight, rot: -10 }],
      ['mushroom', 472, 282, 0.75], ['leaf', 430, 318, 0.6, { fill: C.greenMid }]] },
  // r023 豆腐蒸肉饼
  { id: 'r023', bg: '#FDF2E6', accent: C.orange, vessel: 'plate', steam: 3, items: [
      ['cube', 366, 272, 0.68], ['cube', 438, 272, 0.68]],
    extrasBefore:
      `<ellipse cx="400" cy="304" rx="96" ry="56" fill="#B5714B"/>` +
      `<ellipse cx="400" cy="296" rx="88" ry="48" fill="#C98356"/>`,
    extras:
      `<path d="M 336 292 q 32 -22 64 -4" stroke="${C.yolk}" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      `<path d="M 402 272 q 34 6 52 30" stroke="${C.yolk}" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.85"/>` },
  // r024 鳕鱼土豆泥（婴儿辅食）
  { id: 'r024', bg: '#F5F9F2', accent: C.green, vessel: 'plate', steam: 2,
    items: [['fillet', 398, 284, 1], ['blob', 486, 314, 0.6, { fill: '#F6E8CE' }],
      ['blob', 330, 318, 0.5, { fill: '#F6E8CE' }],
      ['dots', 520, 268, 1, { colors: ['#8CC49A'], r: 4 }]] },
  // r025 西葫芦鸡蛋软饼（婴儿辅食）
  { id: 'r025', bg: '#FFF5E7', accent: C.orange, vessel: 'plate', steam: 0, items: [
      ['dots', 416, 312, 1, { colors: [C.green], r: 4 }]],
    extrasBefore:
      `<circle cx="386" cy="286" r="76" fill="#E8A63C"/><circle cx="386" cy="282" r="70" fill="#F6C453"/>` +
      `<circle cx="416" cy="316" r="70" fill="#E8A63C"/><circle cx="416" cy="313" r="64" fill="#F9D27A"/>` },
  // r026 山药胡萝卜鸡肉粥（婴儿辅食）
  { id: 'r026', bg: '#FFF6EA', accent: C.green, vessel: 'bowl', surface: '#F7EEDD', steam: 3,
    items: [['slice', 362, 298, 0.5], ['strip', 446, 288, 0.6, { fill: C.chicken, inner: C.chickenLight, rot: 8 }],
      ['cube', 428, 268, 0.6, { fill: '#FBF4E6', inner: '#FFFDF6', dark: '#EADFC8' }],
      ['dots', 386, 318, 1, { colors: [C.pumpkinLight], r: 4 }]] },
  // r027 番茄牛腩焖饭
  { id: 'r027', bg: '#FDF2E4', accent: C.orange, vessel: 'bowl', surface: '#FBF3E2', steam: 3,
    items: [['blob', 400, 278, 0.85, { fill: C.tomato }],
      ['cube', 348, 264, 0.6, { fill: C.beef, inner: C.beefLight, dark: '#8F5232' }],
      ['cube', 456, 266, 0.6, { fill: C.beef, inner: C.beefLight, dark: '#8F5232' }],
      ['onionArc', 492, 312, 0.55]],
    extrasBefore:
      `<ellipse cx="400" cy="302" rx="152" ry="54" fill="#FDF7EA"/>` +
      `<ellipse cx="400" cy="302" rx="152" ry="54" fill="none" stroke="#F0E2C8" stroke-width="3"/>` },
  // r028 清蒸南瓜鸡腿肉
  { id: 'r028', bg: '#F4F9EE', accent: C.green, vessel: 'plate', steam: 3,
    items: [['wedge', 344, 300, 1], ['wedge', 306, 266, 0.85],
      ['strip', 452, 282, 0.95, { fill: '#E8B98A', inner: '#F3D9BC', rot: -12 }],
      ['strip', 516, 312, 0.75, { fill: '#E8B98A', inner: '#F3D9BC', rot: 10 }],
      ['strip', 352, 244, 0.5, { fill: '#F2E3B8', inner: '#FAF0D2', rot: -14 }]] },
  // r029 豆腐虾皮小白菜汤
  { id: 'r029', bg: '#FFF3EA', accent: C.orange, vessel: 'bowl', surface: '#F5EBD8', steam: 3,
    items: [['cube', 362, 286, 0.78], ['cube', 456, 292, 0.72],
      ['leaf', 406, 316, 0.8, { fill: C.greenDark }], ['leaf', 500, 312, 0.65, { fill: C.greenDark }],
      ['dots', 336, 312, 1, { colors: [C.pumpkin], r: 4 }]] },
  // r030 紫薯燕麦酸奶杯
  { id: 'r030', bg: '#FFF0F4', accent: C.berry, vessel: 'jar', steam: 0, items: [] },
]

const buildSvg = (spec) => {
  const blob = mix(spec.bg, spec.accent, 0.13)
  const shadow = mix(spec.bg, '#24212A', 0.08)
  const vessel =
    spec.vessel === 'bowl'
      ? bowlSvg(spec.accent, spec.surface, shadow)
      : spec.vessel === 'pot'
        ? potSvg(spec.accent, spec.surface, shadow)
        : spec.vessel === 'jar'
          ? jarSvg(spec.id, spec.accent)
          : plateSvg(spec.accent, shadow)
  const steam = spec.steam ? steamSvg(spec.steam, spec.vessel === 'plate' ? 250 : 244) : ''
  const items = (spec.extrasBefore ?? '') + spec.items.map(([g, x, y, s, o]) => G[g](x, y, s, o)).join('') + (spec.extras ?? '')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${spec.bg}"/>` +
    `<circle cx="400" cy="292" r="252" fill="${blob}"/>` +
    decoSvg(spec.accent) + vessel + steam + items +
    `</svg>`
  )
}

await mkdir(OUT_DIR, { recursive: true })
const hashes = new Map()
for (const spec of SPECS) {
  const jpeg = await sharp(Buffer.from(buildSvg(spec)))
    .jpeg({ progressive: true, mozjpeg: true, quality: 85 })
    .toBuffer()
  const hash = createHash('sha256').update(jpeg).digest('hex')
  const duplicate = hashes.get(hash)
  if (duplicate) {
    console.error(`[generate-recipe-illustrations] 内容重复：${spec.id}.jpg 与 ${duplicate}.jpg`)
    process.exit(1)
  }
  hashes.set(hash, spec.id)
  await writeFile(path.join(OUT_DIR, `${spec.id}.jpg`), jpeg)
}

const written = (await readdir(OUT_DIR)).filter((name) => name.endsWith('.jpg'))
if (written.length !== SPECS.length) {
  console.error(`[generate-recipe-illustrations] 目录中存在 ${written.length} 个文件，预期 ${SPECS.length} 个，请检查是否有遗留文件`)
  process.exit(1)
}
console.log(`[generate-recipe-illustrations] 已生成 ${SPECS.length} 张插画（800x533、内容唯一）`)
