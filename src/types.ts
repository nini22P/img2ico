export const DEFAULT_SIZES = [16, 24, 32, 48, 64, 96, 128, 256]

export interface IcoOptions {
  sizes?: number[];
}

export class IcoResult {
  private _icoBuffer: Buffer

  constructor(icoBuffer: Buffer) {
    this._icoBuffer = icoBuffer
  }

  toBuffer(): Buffer {
    return this._icoBuffer
  }

  toDataUrl(): string {
    return `data:image/x-icon;base64,${this._icoBuffer.toString('base64')}`
  }
}