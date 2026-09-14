// 校验 src/static/recipes 的插画资源集：
// - 覆盖 r001–r030 全部文件
// - 全部为 800×533 JPEG
// - 内容哈希唯一，不允许复制填充
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const IMAGE_DIR = path.resolve('src/static/recipes')
const EXPECTED_IDS = Array.from({ length: 30 }, (_, index) => `r${String(index + 1).padStart(3, '0')}`)

const fail = (message) => {
  console.error(`[verify-recipe-images] ${message}`)
  process.exit(1)
}

const files = (await readdir(IMAGE_DIR)).filter((name) => name.endsWith('.jpg'))
const missing = EXPECTED_IDS.filter((id) => !files.includes(`${id}.jpg`))
if (missing.length) fail(`缺少图片：${missing.join('、')}`)

const unexpected = files.filter((name) => !EXPECTED_IDS.includes(name.replace('.jpg', '')))
if (unexpected.length) fail(`存在意外文件：${unexpected.join('、')}`)

const hashes = new Map()
for (const id of EXPECTED_IDS) {
  const buffer = await readFile(path.join(IMAGE_DIR, `${id}.jpg`))
  const hash = createHash('sha256').update(buffer).digest('hex')
  const duplicate = hashes.get(hash)
  if (duplicate) fail(`图片内容重复：${id}.jpg 与 ${duplicate}.jpg`)
  hashes.set(hash, id)

  // 帧头：SOF0 (0xC0) baseline 或 SOF2 (0xC2) progressive，生成脚本输出 progressive
  const sofOffset = buffer.findIndex((byte, index) =>
    byte === 0xff && index > 0 && buffer[index - 1] !== 0xff && (buffer[index + 1] === 0xc0 || buffer[index + 1] === 0xc2),
  )
  if (sofOffset === -1) fail(`${id}.jpg 不是合法 JPEG`)
  const height = buffer.readUInt16BE(sofOffset + 5)
  const width = buffer.readUInt16BE(sofOffset + 7)
  if (width !== 800 || height !== 533) fail(`${id}.jpg 尺寸为 ${width}x${height}，应为 800x533`)
}

console.log(`[verify-recipe-images] 通过：30 个文件、800x533、内容唯一`)
