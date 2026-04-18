'use client'

import Image from 'next/image'
import type { ParsedCardData } from '@/lib/supabase/types'

interface Props {
  imageUrl: string
  parsed: ParsedCardData
  onChange: (data: ParsedCardData) => void
  rawText?: string
  engine?: string
  engineError?: string
}

const FIELDS: { key: keyof ParsedCardData; label: string; type?: string }[] = [
  { key: 'full_name', label: '氏名' },
  { key: 'name_reading', label: 'ふりがな' },
  { key: 'company_name', label: '会社名' },
  { key: 'department', label: '部署' },
  { key: 'title', label: '役職' },
  { key: 'email', label: 'メール', type: 'email' },
  { key: 'phone', label: '電話（代表）', type: 'tel' },
  { key: 'mobile', label: '携帯', type: 'tel' },
  { key: 'postal_code', label: '郵便番号' },
  { key: 'address', label: '住所' },
  { key: 'website', label: 'ウェブサイト', type: 'url' },
]

export function OcrResultEditor({ imageUrl, parsed, onChange, rawText, engine, engineError }: Props) {
  function handleChange(key: keyof ParsedCardData, value: string) {
    onChange({ ...parsed, [key]: value || undefined })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 名刺画像プレビュー */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">名刺画像</p>
        <div className="relative w-full aspect-[91/55] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <Image src={imageUrl} alt="名刺" fill className="object-contain" />
        </div>
        <p className="text-xs text-gray-400 text-center">画像を見ながら右側の情報を修正してください</p>
        {/* OCR生テキスト（デバッグ用） */}
        {rawText && (
          <details className="mt-2">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
              OCR生テキストを表示 {engine && <span className={`ml-1 px-1 py-0.5 rounded font-mono text-xs ${engine === 'llm' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{engine}</span>}
            </summary>
            {engineError && (
              <p className="mt-1 text-xs text-red-500 break-all">{engineError}</p>
            )}
            <pre className="mt-1 text-xs text-gray-500 bg-gray-50 rounded p-2 whitespace-pre-wrap break-all border border-gray-100 max-h-40 overflow-y-auto">
              {rawText}
            </pre>
          </details>
        )}
      </div>

      {/* OCR結果フォーム */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">OCR読取結果（修正可）</p>
        {FIELDS.map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
              type={type || 'text'}
              value={parsed[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              placeholder={`${label}を入力`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
