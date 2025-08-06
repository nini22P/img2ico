#!/usr/bin/env node

import { program } from 'commander'
import { promises as fs } from 'fs'
import path from 'path'
import img2ico from './index'

program
  .name('img2ico')
  .description('A tool for converting image to ICO format.')
  .version('1.1.6')
  .argument('<inputFile>', 'Path to the input image file to convert')
  .argument('[outputFile]', 'Path to the output .ico file (optional)')
  .option('-s, --sizes <sizes>', 'Comma-separated list of sizes, e.g., "16,24,32,48,64,96,128,256"', '16,24,32,48,64,96,128,256')
  .action(async (inputFile, outputFile, options) => {
    try {
      const inputPath = path.resolve(inputFile)
      console.log(`Input file: ${inputPath}`)

      let outputPath = outputFile
        ? path.resolve(outputFile)
        : path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}.ico`)
      if (path.extname(outputPath).toLowerCase() !== '.ico') {
        outputPath += '.ico'
      }

      const sizes = options.sizes.split(',').map((s: string) => parseInt(s.trim(), 10))
      if (sizes.some(isNaN)) {
        throw new Error('Sizes list contains invalid numbers.')
      }

      console.log(`Target sizes: ${sizes.join('x, ')}x`)
      console.log(`Output file: ${outputPath}`)

      const imageBuffer = await fs.readFile(inputPath)
      const icoBuffer = await img2ico(imageBuffer, { sizes })

      await fs.writeFile(outputPath, icoBuffer)
      console.log('✅ Conversion successful!')

    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ENOENT') {
        console.error(`❌ Error: Input file not found at '${(error as { path?: string }).path}'`)
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        console.error(`❌ Conversion failed: ${(error as { message?: string }).message}`)
      } else {
        console.error('❌ Conversion failed: An unknown error occurred.')
      }
      process.exit(1)
    }
  })

program.parse(process.argv.length === 2 ? [process.argv[0], process.argv[1], '--help'] : process.argv)