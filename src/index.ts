import { Jimp, ResizeStrategy } from 'jimp'
import { Buffer } from 'buffer'

let wasm: {
  img2ico: (imageBuffer: Uint8Array, sizes: Uint32Array) => Uint8Array;
} | null = null;

(async () => {
  try {
    const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined'
    const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null

    let wasmModule

    if (isBrowser) {
      wasmModule = await import('./wasm-web/img2ico_wasm.js')
      await wasmModule.default()
    } else if (isNode) {
      wasmModule = await import('./wasm-node/img2ico_wasm.js')
    } else {
      console.log('Unknown environment, WASM module will not be loaded.')
      return
    }

    wasm = wasmModule
    console.log('WASM module loaded successfully. Using WASM-powered conversion.')
  } catch (e) {
    console.log('Failed to load WASM module, falling back to pure JS implementation.', e)
    wasm = null
  }
})()

export const DEFAULT_SIZES = [16, 24, 32, 48, 64, 96, 128, 256]

/**
 * Options for ICO generation.
 */
export interface IcoOptions {
  /**
   * An array of icon sizes (in pixels) to be generated.
   * The source image will be resized to each of these dimensions.
   */
  sizes?: number[];
}

function detectImageFormat(buffer: Buffer): string | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
    return 'png'
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpeg'
  }
  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
    return 'bmp'
  }
  // WebP: RIFFxxxxWEBP (52 49 46 46 ... 57 45 42 50)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'webp'
  }
  return null
}

/**
 * Converts a source image Buffer into a .ico format Buffer.
 *
 * @param {Buffer} imageBuffer The source image data as a Buffer. PNG format is recommended for transparency support.
 * @param {IcoOptions} [options={}] Configuration options for ICO generation.
 * @param {number[]} [options.sizes=[16, 24, 32, 48, 64, 96, 128, 256]] An array of icon sizes to generate.
 * @returns {Promise<Buffer>} A Promise that resolves with a Buffer containing the .ico file data.
 */
export default async function img2ico(
  imageBuffer: Buffer,
  options: IcoOptions = {}
): Promise<Buffer> {
  const supportedFormats = ['png', 'jpeg', 'bmp', 'webp']
  const detectedFormat = detectImageFormat(imageBuffer)

  if (!detectedFormat || !supportedFormats.includes(detectedFormat)) {
    throw new Error(`Unsupported image format: ${detectedFormat || 'unknown'}. Only PNG, JPEG, BMP, and WebP are supported.`)
  }

  const sizes = options.sizes || DEFAULT_SIZES

  if (wasm) {
    try {
      const icoUint8Array = wasm.img2ico(imageBuffer, new Uint32Array(sizes))
      return Buffer.from(icoUint8Array)
    } catch (error) {
      console.error('WASM execution failed, falling back to JS implementation.', error)
    }
  }

  const baseImage = await Jimp.read(imageBuffer)

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

  // --- ICO file structure ---
  // 1. ICONDIR header (6 bytes)
  // 2. ICONDIRENTRY for each image (16 bytes per image)
  // 3. Image data (PNG data for each image)

  const headerSize = 6
  const directoryEntrySize = 16
  const headerAndDirectorySize = headerSize + pngBuffers.length * directoryEntrySize

  const headerBuffer = Buffer.alloc(headerAndDirectorySize)

  // ICONDIR header
  headerBuffer.writeUInt16LE(0, 0) // Reserved, must be 0
  headerBuffer.writeUInt16LE(1, 2) // Image type: 1 for ICO
  headerBuffer.writeUInt16LE(pngBuffers.length, 4) // Number of images

  let currentOffset = headerAndDirectorySize

  for (let i = 0; i < pngBuffers.length; i++) {
    const pngBuffer = pngBuffers[i]
    const size = sizes[i]

    // The size (width/height) in the ICONDIRENTRY is 1 byte.
    // A value of 0 means 256 pixels.
    // If the size is greater than 256, we set it to 0.
    const width = size >= 256 ? 0 : size
    const height = size >= 256 ? 0 : size
    const imageSizeInBytes = pngBuffer.length

    const entryOffset = headerSize + i * directoryEntrySize

    // ICONDIRENTRY
    headerBuffer.writeUInt8(width, entryOffset)         // bWidth
    headerBuffer.writeUInt8(height, entryOffset + 1)       // bHeight
    headerBuffer.writeUInt8(0, entryOffset + 2)          // bColorCount (0 for true color)
    headerBuffer.writeUInt8(0, entryOffset + 3)          // bReserved
    headerBuffer.writeUInt16LE(0, entryOffset + 4)       // wPlanes (0 when using PNG)
    headerBuffer.writeUInt16LE(0, entryOffset + 6)       // wBitCount (0 when using PNG)
    headerBuffer.writeUInt32LE(imageSizeInBytes, entryOffset + 8) // dwBytesInRes
    headerBuffer.writeUInt32LE(currentOffset, entryOffset + 12) // dwImageOffset

    currentOffset += imageSizeInBytes
  }

  return Buffer.concat([headerBuffer, ...pngBuffers])
}