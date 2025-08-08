import { Jimp, ResizeStrategy } from 'jimp'
import { Buffer } from 'buffer'
import { DEFAULT_SIZES, IcoOptions, IcoResult } from './types.js'

export async function executeWasmOrFallback(
  wasmModule: { img2ico: (buffer: Uint8Array, sizes: Uint32Array) => Uint8Array; } | null,
  buffer: Buffer,
  sizes: number[],
  options: IcoOptions
): Promise<IcoResult> {
  if (wasmModule) {
    try {
      const icoUint8Array = wasmModule.img2ico(buffer, new Uint32Array(sizes))
      const icoBuffer = Buffer.from(icoUint8Array)
      return new IcoResult(icoBuffer)
    } catch (error) {
      console.error('WASM execution failed, falling back to JS implementation.', error)
    }
  }
  return img2icoJs(buffer, options)
}

/**
 * Converts a source image Buffer into a .ico format Buffer using pure JS.
 *
 * @param {Buffer} buffer The source image data as a Buffer.
 * @param {IcoOptions} [options={}] Configuration options for ICO generation.
 * @returns {Promise<Buffer>} A Promise that resolves with a Buffer containing the .ico file data.
 */
export async function img2icoJs(
  buffer: Buffer,
  options: IcoOptions = {}
): Promise<IcoResult> {

  const sizes = options.sizes || DEFAULT_SIZES

  const baseImage = await Jimp.fromBuffer(buffer)

  const pngBuffers = await Promise.all(
    sizes.map(async (size) => {
      const canvas = new Jimp({ width: size, height: size, color: 0x0 }) // 0x0 is transparent
      const scaledImage = baseImage.clone().scaleToFit({ w: size, h: size, mode: ResizeStrategy.HERMITE })
      const x = (size - scaledImage.width) / 2
      const y = (size - scaledImage.height) / 2
      canvas.composite(scaledImage, x, y)
      return canvas.getBuffer('image/png')
    })
  )

  const headerSize = 6
  const directoryEntrySize = 16
  const headerAndDirectorySize = headerSize + pngBuffers.length * directoryEntrySize
  const headerBuffer = Buffer.alloc(headerAndDirectorySize)

  headerBuffer.writeUInt16LE(0, 0)
  headerBuffer.writeUInt16LE(1, 2)
  headerBuffer.writeUInt16LE(pngBuffers.length, 4)

  let currentOffset = headerAndDirectorySize

  for (let i = 0; i < pngBuffers.length; i++) {
    const pngBuffer = pngBuffers[i]
    const size = sizes[i]
    const width = size >= 256 ? 0 : size
    const height = size >= 256 ? 0 : size
    const imageSizeInBytes = pngBuffer.length
    const entryOffset = headerSize + i * directoryEntrySize

    headerBuffer.writeUInt8(width, entryOffset)
    headerBuffer.writeUInt8(height, entryOffset + 1)
    headerBuffer.writeUInt8(0, entryOffset + 2)
    headerBuffer.writeUInt8(0, entryOffset + 3)
    headerBuffer.writeUInt16LE(0, entryOffset + 4)
    headerBuffer.writeUInt16LE(0, entryOffset + 6)
    headerBuffer.writeUInt32LE(imageSizeInBytes, entryOffset + 8)
    headerBuffer.writeUInt32LE(currentOffset, entryOffset + 12)

    currentOffset += imageSizeInBytes
  }

  const icoBuffer = Buffer.concat([headerBuffer, ...pngBuffers])

  return new IcoResult(icoBuffer)
}


