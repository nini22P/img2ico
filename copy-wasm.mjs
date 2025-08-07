import { cp, rm } from 'fs/promises'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sourceNode = resolve(__dirname, 'src/wasm-node')
const destNode = resolve(__dirname, 'dist/wasm-node')

const sourceWeb = resolve(__dirname, 'src/wasm-web')
const destWeb = resolve(__dirname, 'dist/wasm-web')

async function copyWasm() {
  try {
    await cp(sourceNode, destNode, { recursive: true })
    await rm(`${destNode}/.gitignore`, { recursive: true, force: true })
    console.log(`Copied ${sourceNode} to ${destNode}`)

    await cp(sourceWeb, destWeb, { recursive: true })
    await rm(`${destWeb}/.gitignore`, { recursive: true, force: true })
    console.log(`Copied ${sourceWeb} to ${destWeb}`)

    console.log('✅ WASM files copied to dist successfully!')
  } catch (err) {
    console.error('❌ Error copying WASM files:', err)
    process.exit(1)
  }
}

copyWasm()