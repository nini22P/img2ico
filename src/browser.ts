import { Buffer } from 'buffer'
import { executeWasmOrFallback } from './core.js'
import { DEFAULT_SIZES, IcoOptions, IcoResult } from './types.js'
import { detectImageFormat } from './utils.js'

let wasm: { img2ico: (buffer: Uint8Array, sizes: Uint32Array) => Uint8Array; } | null = null;

// Asynchronously load the WASM module for the Web
(async () => {
  try {
    const wasmModule = await import('./wasm-web/img2ico_wasm.js')
    await wasmModule.default()
    wasm = wasmModule
  } catch (e) {
    console.log('Failed to load WASM module, falling back to pure JS implementation.', e)
    wasm = null
  }
})()

/**
 * Converts a source image into a .ico format.
 *
 * @param {ArrayBuffer | Buffer} buffer The source image data as an ArrayBuffer or Buffer.
 * @param {IcoOptions} [options={}] Configuration options for ICO generation.
 * @returns {Promise<IcoResult>} A Promise that resolves with an IcoResult instance.
 */
export default async function img2ico(
  buffer: ArrayBuffer | Buffer,
  options: IcoOptions = {}
): Promise<IcoResult> {
  buffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  const sizes = options.sizes || DEFAULT_SIZES

  const supportedFormats = ['png', 'jpeg', 'bmp', 'webp']
  const detectedFormat = detectImageFormat(buffer)

  if (!detectedFormat || !supportedFormats.includes(detectedFormat)) {
    throw new Error(`Unsupported image format: ${detectedFormat || 'unknown'}. Only PNG, JPEG, BMP, and WebP are supported.`)
  }

  return executeWasmOrFallback(wasm, buffer, sizes, options)
}
