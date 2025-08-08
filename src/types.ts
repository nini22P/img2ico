export const DEFAULT_SIZES = [16, 24, 32, 48, 64, 96, 128, 256]

export interface IcoOptions {
  sizes?: number[];
}

export class IcoResult {
  private _icoBuffer: Buffer
  private _sizes: number[]

  constructor(icoBuffer: Buffer, sizes: number[]) {
    this._icoBuffer = icoBuffer
    this._sizes = sizes
  }

  get size(): number {
    return this._icoBuffer.length
  }

  get sizes(): number[] {
    return this._sizes
  }

  toArrayBuffer(): ArrayBuffer {
    const arrayBuffer = new ArrayBuffer(this._icoBuffer.length)
    const view = new Uint8Array(arrayBuffer)
    view.set(this._icoBuffer)
    return arrayBuffer
  }

  toBuffer(): Buffer {
    return this._icoBuffer
  }

  toBlob(): Blob {
    return new Blob([this.toArrayBuffer()], { type: 'image/x-icon' })
  }

  toBase64(): string {
    return this._icoBuffer.toString('base64')
  }

  toDataUrl(): string {
    return `data:image/x-icon;base64,${this.toBase64()}`
  }
}