import { Jimp, ResizeStrategy } from 'jimp'

export const DEFAULT_SIZES = [16, 24, 32, 48, 64, 96, 128, 256]

/**
 * Options for ICO generation.
 */
export interface IcoOptions {
  /**
   * An array of icon sizes (in pixels) to be generated.
   * Each size value should not exceed 256.
   * The source image will be resized to each of these dimensions.
   */
  sizes?: number[];
}

/**
 * Converts a source image Buffer into a .ico format Buffer.
 *
 * @param {Buffer} imageBuffer The source image data as a Buffer. PNG format is recommended for transparency support.
 * @param {IcoOptions} [options={}] Configuration options for ICO generation.
 * @param {number[]} [options.sizes=[16, 24, 32, 48, 64, 96, 128, 256]] An array of icon sizes to generate. Each size must not exceed 256.
 * @returns {Promise<Buffer>} A Promise that resolves with a Buffer containing the .ico file data.
 */
export default async function img2ico(
  imageBuffer: Buffer,
  options: IcoOptions = {}
): Promise<Buffer> {
  const sizes = options.sizes || DEFAULT_SIZES

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
    const width = size === 256 ? 0 : size
    const height = size === 256 ? 0 : size
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