import { Jimp, ResizeStrategy } from 'jimp'

export const DEFAULT_SIZES = [16, 32, 48, 64, 96, 256]

/**
 * Options for ICO generation
 *
 * @property {number[]} [sizes] Array of icon sizes to generate
 */
export interface IcoOptions {
  sizes?: number[];
}

/**
 * Converts an image Buffer to an .ico format Buffer.
 *
 * @param imageBuffer The image Buffer.
 * @param options Options for ICO generation.
 * @returns A Buffer containing the .ico file data.
 */
export default async function img2ico(
  imageBuffer: Buffer,
  options: IcoOptions = {}
): Promise<Buffer> {
  const sizes = options.sizes || DEFAULT_SIZES

  const baseImage = await Jimp.read(imageBuffer)
  const resizedImages: InstanceType<typeof Jimp>[] = []
  for (const size of sizes) {
    const canvas = new Jimp({ width: size, height: size, color: 0x0 }) // 0x0 is transparent

    const scaledImage = baseImage.clone().scaleToFit({ w: size, h: size, mode: ResizeStrategy.HERMITE })

    const x = (size - scaledImage.width) / 2
    const y = (size - scaledImage.height) / 2

    canvas.composite(scaledImage, x, y)

    resizedImages.push(canvas)
  }

  const headerSize = 6
  const directoryEntrySize = 16
  const headerAndDirectorySize = headerSize + resizedImages.length * directoryEntrySize
  const headerBuffer = Buffer.alloc(headerAndDirectorySize)

  headerBuffer.writeUInt16LE(0, 0)
  headerBuffer.writeUInt16LE(1, 2)
  headerBuffer.writeUInt16LE(resizedImages.length, 4)

  let currentOffset = headerAndDirectorySize
  const imageDataParts: Buffer[] = []

  for (let i = 0; i < resizedImages.length; i++) {
    const image = resizedImages[i]
    const { width, height, data: rgbaBuffer } = image.bitmap

    const bgraBuffer = Buffer.alloc(rgbaBuffer.length)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sourceIndex = (y * width + x) * 4
        const destIndex = ((height - 1 - y) * width + x) * 4

        bgraBuffer[destIndex] = rgbaBuffer[sourceIndex + 2]     // Blue
        bgraBuffer[destIndex + 1] = rgbaBuffer[sourceIndex + 1] // Green
        bgraBuffer[destIndex + 2] = rgbaBuffer[sourceIndex]     // Red
        bgraBuffer[destIndex + 3] = rgbaBuffer[sourceIndex + 3] // Alpha
      }
    }

    const dibHeader = Buffer.alloc(40)
    dibHeader.writeUInt32LE(40, 0)
    dibHeader.writeInt32LE(width, 4)
    dibHeader.writeInt32LE(height * 2, 8)
    dibHeader.writeUInt16LE(1, 12)
    dibHeader.writeUInt16LE(32, 14)
    dibHeader.writeUInt32LE(0, 16)
    dibHeader.writeUInt32LE(bgraBuffer.length, 20)
    dibHeader.writeInt32LE(0, 24)
    dibHeader.writeInt32LE(0, 28)
    dibHeader.writeUInt32LE(0, 32)
    dibHeader.writeUInt32LE(0, 36)

    const totalImageDataSize = dibHeader.length + bgraBuffer.length
    const entryOffset = headerSize + i * directoryEntrySize

    headerBuffer.writeUInt8(width === 256 ? 0 : width, entryOffset)
    headerBuffer.writeUInt8(height === 256 ? 0 : height, entryOffset + 1)
    headerBuffer.writeUInt8(0, entryOffset + 2)
    headerBuffer.writeUInt8(0, entryOffset + 3)
    headerBuffer.writeUInt16LE(1, entryOffset + 4)
    headerBuffer.writeUInt16LE(32, entryOffset + 6)
    headerBuffer.writeUInt32LE(totalImageDataSize, entryOffset + 8)
    headerBuffer.writeUInt32LE(currentOffset, entryOffset + 12)

    imageDataParts.push(dibHeader, bgraBuffer)
    currentOffset += totalImageDataSize
  }

  return Buffer.concat([headerBuffer, ...imageDataParts])
}