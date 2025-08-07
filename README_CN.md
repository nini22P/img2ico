# img2ico

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/img2ico.svg)](https://www.npmjs.com/package/img2ico)
![NPM Downloads](https://img.shields.io/npm/d18m/img2ico)
[![Build Status](https://github.com/nini22P/img2ico/actions/workflows/ci.yml/badge.svg)](https://github.com/nini22P/img2ico/actions/workflows/ci.yml)

[English](README.md) | 简体中文

一个将图像转换为 ICO 格式的工具。

## 特性
- 支持将 PNG, JPEG, BMP, 和 WebP 图像格式转换为 ICO。
- 使用 WASM 进行更快的处理。如果 WASM 运行失败，将回退到纯 JavaScript 实现。
- 支持自定义 ICO 尺寸。
- 可作为 CLI 工具、Node.js 模块和在浏览器中使用。

## 使用方法

### 命令行工具 (CLI)
通过命令行将图片转换为 ICO。

```bash
npx img2ico <inputFile> [outputFile] [-s, --sizes <sizes>]
```

- `<inputFile>`: 输入图片文件的路径。
- `[outputFile]`: 可选的输出 .ico 文件路径。如果省略，默认为 `<inputFile>.ico`。
- `-s, --sizes <sizes>`: 逗号分隔的所需 ICO 尺寸列表（例如 `16,32,64`）。默认尺寸为 `16,24,32,48,64,96,128,256`。

**示例：**
```bash
npx img2ico icon.png
npx img2ico icon.png icon.ico -s "16,32,64"
```

### 网页界面 (Web UI)
访问网页界面进行便捷转换：[https://nini22p.github.io/img2ico/](https://nini22p.github.io/img2ico/)

网页工具提供了广泛的尺寸选择，包括 `16, 20, 24, 30, 32, 36, 40, 48, 60, 64, 72, 80, 96, 128, 256, 512, 1024`。

### Node.js
在您的 Node.js 项目中使用 `img2ico`。

```bash
npm install img2ico
```

```ts
import img2ico from 'img2ico';
import { promises as fs } from 'fs';

async function convertImage() {
  const imageBuffer = await fs.readFile('icon.png');

  // 默认情况下，img2ico 生成以下尺寸的图标：
  // [16, 24, 32, 48, 64, 96, 128, 256]。
  const icoBuffer = await img2ico(imageBuffer);

  // 要指定自定义尺寸集，请将 options 对象作为第二个参数传递。
  // 例如，仅生成 16px, 32px, 和 64px 的图标：
  // const icoBuffer = await img2ico(imageBuffer, { sizes: [16, 32, 64] });

  await fs.writeFile('icon.ico', icoBuffer);
  console.log('ICO 创建成功！');
}

convertImage();
```

### 浏览器
在您的 Web 项目中使用 `img2ico`。

```bash
npm install img2ico
```

```ts
import img2ico from 'img2ico';
import { Buffer } from 'buffer'; // 假设 Buffer polyfill 可用

async function convertImageInBrowser(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer); // 将 ArrayBuffer 转换为 Buffer

  // 默认情况下，img2ico 生成以下尺寸的图标：
  // [16, 24, 32, 48, 64, 96, 128, 256]。
  const icoBuffer = await img2ico(imageBuffer);

  // 要指定自定义尺寸集，请将 options 对象作为第二个参数传递。
  // 例如，仅生成 16px, 32px, 和 64px 的图标：
  // const icoBuffer = await img2ico(imageBuffer, { sizes: [16, 32, 64] });

  // 示例：创建下载链接
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

// 示例用法，配合文件输入：
document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = (event.target as HTMLInputElement).files[0];
  if (file) {
    await convertImageInBrowser(file);
  }
});
```

## 许可证
[MIT](./LICENSE)