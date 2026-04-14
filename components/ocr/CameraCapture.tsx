'use client'

import { useRef } from 'react'

interface Props {
  onCapture: (file: File, previewUrl: string) => void
  disabled?: boolean
}

export function CameraCapture({ onCapture, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // HEIC形式はJPEGに変換
    let processedFile = file
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      try {
        const heic2any = (await import('heic2any')).default
        const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 }) as Blob
        processedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
      } catch {
        // HEIC変換失敗時はそのまま使用
      }
    }

    // canvasでリサイズ（1200px以下・JPEG85%）
    const resizedFile = await resizeImage(processedFile, 1200, 0.85)
    const previewUrl = URL.createObjectURL(resizedFile)
    onCapture(resizedFile, previewUrl)

    // 同じファイルを再選択できるようにリセット
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      {/* カメラ撮影（スマホ） */}
      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
        <div className="text-center">
          <div className="text-3xl mb-2">📷</div>
          <p className="text-sm font-medium text-blue-700">カメラで撮影</p>
          <p className="text-xs text-blue-500 mt-1">タップして名刺を撮影</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>

      {/* ファイル選択（PC・既存画像） */}
      <label className="flex items-center justify-center w-full h-12 border border-gray-200 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
        <span className="text-sm text-gray-600 mr-2">📁</span>
        <span className="text-sm text-gray-600">ファイルから選択</span>
        <input
          type="file"
          accept="image/*,image/heic"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
    </div>
  )
}

async function resizeImage(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}
