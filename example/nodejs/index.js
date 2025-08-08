import img2ico from 'img2ico'
import fs from 'fs/promises'

async function convertImage() {
  const imageBuffer = await fs.readFile('icon.png')

  // By default, img2ico generates icons with the following sizes:
  // [16, 24, 32, 48, 64, 96, 128, 256].
  const icoResult = await img2ico(imageBuffer)

  // To specify a custom set of sizes, pass an options object as the
  // second argument. For example, to generate only 16px, 32px, and 48px icons:
  // const icoResult = await img2ico(imageBuffer, { sizes: [16, 32, 48] });

  // Get the ICO data as a Buffer
  const icoBuffer = icoResult.toBuffer()
  await fs.writeFile('icon.ico', icoBuffer)
  console.log('ICO created successfully!')
}

convertImage()