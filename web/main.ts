import './style.css'
import { Buffer } from 'buffer'
window.Buffer = Buffer
import img2ico, { DEFAULT_SIZES } from '../src/index'

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('image-input') as HTMLInputElement
  const fileNameInput = document.getElementById('file-name') as HTMLInputElement
  const convertBtn = document.getElementById('convert-button') as HTMLButtonElement
  const statusDiv = document.getElementById('status') as HTMLDivElement
  const sizesCheckboxesDiv = document.getElementById('sizes-checkboxes') as HTMLDivElement

  const icoSizes = [16, 20, 24, 30, 32, 36, 40, 48, 60, 64, 72, 80, 96, 128, 256, 512, 1024]

  icoSizes.forEach(size => {
    const label = document.createElement('label')
    label.htmlFor = `size-${size}`
    label.innerHTML = `
      <input type="checkbox" id="size-${size}" class="size-checkbox" value="${size}" ${DEFAULT_SIZES.includes(size) ? 'checked' : ''}>
      <span>${size}x${size}</span>
    `
    sizesCheckboxesDiv.appendChild(label)
  })

  convertBtn.addEventListener('click', async () => {
    if (!fileInput.files || fileInput.files.length === 0) {
      statusDiv.textContent = 'ERROR: NO FILE SELECTED'
      return
    }

    const file = fileInput.files[0]
    statusDiv.textContent = 'CONVERTING...'

    try {
      const arrayBuffer = await file.arrayBuffer()
      const imageBuffer = Buffer.from(arrayBuffer)

      const selectedCheckboxes = Array.from(document.querySelectorAll('.size-checkbox:checked')) as HTMLInputElement[]
      const sizes = selectedCheckboxes.map(cb => parseInt(cb.value, 10))

      if (sizes.length === 0) {
        statusDiv.textContent = 'ERROR: SELECT AT LEAST ONE SIZE'
        return
      }

      const icoBuffer = await img2ico(imageBuffer, { sizes })

      const fileName = fileNameInput.value.length === 0
        ? 'icon.ico'
        : (
          (
            fileNameInput.value.endsWith('.ico')
              ? fileNameInput.value.slice(0, -4)
              : fileNameInput.value
          ).replace(/\.{2,}/g, '.').replace(/\.$/, '') || 'icon') + '.ico'
      const blob = new Blob([icoBuffer], { type: 'image/x-icon' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      statusDiv.textContent = 'CONVERSION SUCCESSFUL!'

    } catch (error) {
      console.error(error)
      statusDiv.textContent = `ERROR: ${error instanceof Error ? error.message : 'UNKNOWN ERROR'}`
    }
  })
})
