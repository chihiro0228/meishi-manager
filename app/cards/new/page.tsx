'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CameraCapture } from '@/components/ocr/CameraCapture'
import { OcrResultEditor } from '@/components/ocr/OcrResultEditor'
import { createClient } from '@/lib/supabase/client'
import type { ParsedCardData } from '@/lib/supabase/types'

type Step = 'capture' | 'review' | 'saving'

export default function NewCardPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('capture')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ocrRawText, setOcrRawText] = useState('')
  const [ocrEngine, setOcrEngine] = useState('')
  const [parsed, setParsed] = useState<ParsedCardData>({})
  const [notes, setNotes] = useState('')
  const [metAt, setMetAt] = useState('')
  const [metContext, setMetContext] = useState('')
  const [error, setError] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)

  async function handleCapture(file: File, previewUrl: string) {
    setImageFile(file)
    setImagePreview(previewUrl)
    setError('')
    setOcrLoading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/ocr', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'OCR処理に失敗しました。手動で入力してください。')
        setParsed({})
      } else {
        setOcrRawText(data.rawText || '')
        setOcrEngine(data.engine || '')
        setParsed(data.parsed || {})
      }
    } catch {
      setError('OCR通信エラー。手動で入力してください。')
    } finally {
      setOcrLoading(false)
      setStep('review')
    }
  }

  async function handleSave() {
    if (!imageFile) return
    setStep('saving')
    setError('')

    const supabase = createClient()

    // 1. 画像をStorageにアップロード
    const ext = imageFile.name.split('.').pop() || 'jpg'
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('business-card-images')
      .upload(filename, imageFile, { contentType: imageFile.type })

    if (uploadError) {
      setError(`画像のアップロードに失敗しました: ${uploadError.message}`)
      setStep('review')
      return
    }

    // 2. DBに保存
    const { error: insertError } = await supabase.from('business_cards').insert({
      ...parsed,
      image_path: uploadData.path,
      ocr_raw_text: ocrRawText || null,
      notes: notes || null,
      met_at: metAt || null,
      met_context: metContext || null,
    })

    if (insertError) {
      setError(`保存に失敗しました: ${insertError.message}`)
      setStep('review')
      return
    }

    router.push('/cards')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/cards" className="text-gray-500 hover:text-gray-700">
          ← 戻る
        </Link>
        <h1 className="font-semibold text-gray-900">名刺を追加</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 pb-20">
        {step === 'capture' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h2 className="font-medium text-gray-900 mb-3">名刺を撮影してください</h2>
              {ocrLoading ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <div className="animate-spin text-3xl mb-3">⟳</div>
                  <p className="text-sm">OCR処理中...</p>
                </div>
              ) : (
                <CameraCapture onCapture={handleCapture} disabled={ocrLoading} />
              )}
            </div>
          </div>
        )}

        {(step === 'review' || step === 'saving') && imagePreview && (
          <div className="space-y-4">
            {error && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                ⚠️ {error}
              </div>
            )}

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <OcrResultEditor
                imageUrl={imagePreview}
                parsed={parsed}
                onChange={setParsed}
                rawText={ocrRawText}
                engine={ocrEngine}
              />
            </div>

            {/* 追加メモ */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
              <h3 className="font-medium text-gray-900">名刺交換の記録</h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">交換日</label>
                <input
                  type="date"
                  value={metAt}
                  onChange={(e) => setMetAt(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">交換した状況（展示会・訪問など）</label>
                <input
                  type="text"
                  value={metContext}
                  onChange={(e) => setMetContext(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: FOODEX 2026、工場訪問"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">メモ</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="担当製品、特記事項など"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('capture'); setImagePreview(null) }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                disabled={step === 'saving'}
              >
                撮り直す
              </button>
              <button
                onClick={handleSave}
                disabled={step === 'saving'}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {step === 'saving' ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
