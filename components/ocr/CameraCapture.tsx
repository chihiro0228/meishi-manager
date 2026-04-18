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

    // 名刺比率（91:55）に白背景でレターボックス化してリサイズ
    const resizedFile = await resizeToCardRatio(processedFile, 1200, 0.88)
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

// 名刺標準比率 91mm:55mm
const CARD_RATIO = 91 / 55

/**
 * 名刺比率（91:55）に白背景でレターボックス化してリサイズする。
 * 画像の内容を切り抜かず、全体を収めるように余白を追加する。
 */
async function resizeToCardRatio(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)

      // 出力サイズを名刺比率で確定
      const srcRatio = img.width / img.height
      let outW: number, outH: number
      if (srcRatio > CARD_RATIO) {
        // 元画像が横長すぎる → 幅に合わせて高さを名刺比率に拡張
        outW = Math.min(img.width, maxWidth)
        outH = Math.round(outW / CARD_RATIO)
      } else {
        // 元画像が縦長 or ほぼ同比率 → 高さから幅を名刺比率で計算
        outH = Math.round(Math.min(img.width, maxWidth) / CARD_RATIO)
        outW = Math.round(outH * CARD_RATIO)
      }

      // 元画像をoutWに収まるようスケール
      const scale = Math.min(outW / img.width, outH / img.height)
      const drawW = Math.round(img.width * scale)
      const drawH = Math.round(img.height * scale)
      const offsetX = Math.round((outW - drawW) / 2)
      const offsetY = Math.round((outH - drawH) / 2)

      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, outW, outH)
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH)

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
