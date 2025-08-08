import { useRef, useState } from 'react'
import './App.css'
import img2ico from 'img2ico'

function App() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const files = event.dataTransfer.files
    if (files.length > 0) {
      handleConvert(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleConvert(files[0])
    }
  }

  const handleConvert = async (file: File) => {
    setIsConverting(true)
    try {
      const buffer = await file.arrayBuffer()
      const icoResult = await img2ico(buffer)
      const dataUrl = icoResult.toDataUrl()
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = 'icon.ico'
      link.click()
      link.remove()
    } catch (error) {
      console.error(error)
    }
    setIsConverting(false)
  }

  return (
    <div id="app">
      <h1>img2ico-vite-react-ts-example</h1>
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {isConverting ? (
          <div className="loading-spinner"></div>
        ) : (
          <p>Drag and drop an image here, or click to select a file</p>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}

export default App
