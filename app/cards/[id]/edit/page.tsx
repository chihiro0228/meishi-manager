'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { BusinessCard, ParsedCardData } from '@/lib/supabase/types'

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

export default function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [card, setCard] = useState<BusinessCard | null>(null)
  const [formData, setFormData] = useState<Partial<BusinessCard>>({})
  const [tagsInput, setTagsInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from('business_cards')
      .select('*')
      .eq('id', Number(id))
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setError('名刺が見つかりません'); setLoading(false); return }
        setCard(data)
        setFormData(data)
        setTagsInput(data.tags?.join(', ') || '')
        setLoading(false)
      })
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !card) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const { error: updateError } = await supabase
      .from('business_cards')
      .update({ ...formData, tags })
      .eq('id', Number(id))

    if (updateError) {
      setError(`保存に失敗しました: ${updateError.message}`)
      setSaving(false)
      return
    }

    router.push(`/cards/${id}`)
    router.refresh()
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/cards/${id}`} className="text-gray-500 hover:text-gray-700 text-sm">
          ← キャンセル
        </Link>
        <h1 className="font-semibold text-gray-900">名刺を編集</h1>
      </header>

      <form onSubmit={handleSave} className="max-w-lg mx-auto p-4 space-y-4 pb-20">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          {FIELDS.map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type || 'text'}
                value={(formData[key] as string) || ''}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value || null })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`${label}を入力`}
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">交換日</label>
            <input
              type="date"
              value={formData.met_at || ''}
              onChange={(e) => setFormData({ ...formData, met_at: e.target.value || null })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">交換した状況</label>
            <input
              type="text"
              value={formData.met_context || ''}
              onChange={(e) => setFormData({ ...formData, met_context: e.target.value || null })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: FOODEX 2026"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              タグ（カンマ区切り）
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 原材料メーカー, 包材"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">メモ</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="特記事項など"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </form>
    </div>
  )
}
