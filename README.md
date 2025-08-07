# img2ico

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/img2ico.svg)](https://www.npmjs.com/package/img2ico)
![NPM Downloads](https://img.shields.io/npm/d18m/img2ico)
[![Build Status](https://github.com/nini22P/img2ico/actions/workflows/ci.yml/badge.svg)](https://github.com/nini22P/img2ico/actions/workflows/ci.yml)

English | [简体中文](README_CN.md)

A tool for converting image to ICO format.

## Features
- Convert PNG, JPEG, BMP, and WebP image formats to ICO.
- Uses WASM for faster processing. If WASM running fails, it falls back to a pure JavaScript implementation.
- Supports custom ICO sizes.
- Available as a CLI tool, Node.js module, and for use in browsers.

## Usage

### CLI
Convert images to ICO from your command line.

```bash
npx img2ico <inputFile> [outputFile] [-s, --sizes <sizes>]
```

- `<inputFile>`: Path to the input image file.
- `[outputFile]`: Optional path for the output .ico file. If omitted, it defaults to `<inputFile>.ico`.
- `-s, --sizes <sizes>`: Comma-separated list of desired ICO sizes (e.g., `16,32,64`). Default sizes are `16,24,32,48,64,96,128,256`.

**Examples:**
```bash
npx img2ico icon.png
npx img2ico icon.png icon.ico -s "16,32,64"
```

### Web UI
Access the web interface for easy conversion: [https://nini22p.github.io/img2ico/](https://nini22p.github.io/img2ico/)

The web tool provides a wide range of size options, including `16, 20, 24, 30, 32, 36, 40, 48, 60, 64, 72, 80, 96, 128, 256, 512, 1024`.

### Node.js
Use `img2ico` in your Node.js project.

```bash
npm install img2ico
```

```ts
import img2ico from 'img2ico';
import { promises as fs } from 'fs';

async function convertImage() {
  const imageBuffer = await fs.readFile('icon.png');

  // By default, img2ico generates icons with the following sizes:
  // [16, 24, 32, 48, 64, 96, 128, 256].
  const icoBuffer = await img2ico(imageBuffer);

  // To specify a custom set of sizes, pass an options object as the
  // second argument. For example, to generate only 16px, 32px, and 64px icons:
  // const icoBuffer = await img2ico(imageBuffer, { sizes: [16, 32, 64] });

  await fs.writeFile('icon.ico', icoBuffer);
  console.log('ICO created successfully!');
}

convertImage();
```

### Browser
Use `img2ico` in your web project.

```bash
npm install img2ico
```

```ts
import img2ico from 'img2ico';
import { Buffer } from 'buffer'; // Assuming Buffer polyfill is available

async function convertImageInBrowser(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer

  // By default, img2ico generates icons with the following sizes:
  // [16, 24, 32, 48, 64, 96, 128, 256].
  const icoBuffer = await img2ico(imageBuffer);

  // To specify a custom set of sizes, pass an options object as the
  // second argument. For example, to generate only 16px, 32px, and 64px icons:
  // const icoBuffer = await img2ico(imageBuffer, { sizes: [16, 32, 64] });

  // Example: Create a download link
  const blob = new Blob([icoBuffer], { type: 'image/x-icon' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'icon.ico';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Example usage with a file input:
document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = (event.target as HTMLInputElement).files[0];
  if (file) {
    await convertImageInBrowser(file);
  }
});
```

## License
[MIT](./LICENSE)