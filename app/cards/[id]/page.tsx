import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CardDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: card, error } = await supabase
    .from('business_cards')
    .select('*')
    .eq('id', Number(id))
    .single()

  if (error || !card) notFound()

  // 画像のsigned URL取得
  let imageUrl: string | null = null
  if (card.image_path) {
    const { data } = await supabase.storage
      .from('business-card-images')
      .createSignedUrl(card.image_path, 3600)
    imageUrl = data?.signedUrl || null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/cards" className="text-gray-500 hover:text-gray-700 text-sm">
          ← 一覧
        </Link>
        <Link
          href={`/cards/${card.id}/edit`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          編集
        </Link>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-20">
        {/* 名刺画像 */}
        {imageUrl && (
          <div className="relative w-full aspect-[1.77/1] rounded-xl overflow-hidden border border-gray-200">
            <Image src={imageUrl} alt={card.full_name || '名刺'} fill className="object-contain bg-gray-50" />
          </div>
        )}

        {/* メイン情報 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <div>
            <p className="text-xl font-bold text-gray-900">{card.full_name || '（名前なし）'}</p>
            {card.name_reading && <p className="text-sm text-gray-400">{card.name_reading}</p>}
          </div>
          {card.company_name && (
            <p className="text-base font-medium text-gray-700">{card.company_name}</p>
          )}
          {(card.department || card.title) && (
            <p className="text-sm text-gray-500">
              {[card.department, card.title].filter(Boolean).join(' / ')}
            </p>
          )}

          {/* 連絡先 */}
          <div className="pt-2 space-y-2 border-t border-gray-50">
            {card.email && (
              <a href={`mailto:${card.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <span>✉️</span> {card.email}
              </a>
            )}
            {card.phone && (
              <a href={`tel:${card.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <span>📞</span> {card.phone}
              </a>
            )}
            {card.mobile && (
              <a href={`tel:${card.mobile}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <span>📱</span> {card.mobile}
              </a>
            )}
            {card.address && (
              <p className="flex items-start gap-2 text-sm text-gray-600">
                <span>📍</span>
                <span>{card.address}</span>
              </p>
            )}
            {card.website && (
              <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <span>🌐</span> {card.website}
              </a>
            )}
          </div>
        </div>

        {/* 名刺交換記録 */}
        {(card.met_at || card.met_context || card.notes) && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">交換記録</p>
            {card.met_at && (
              <p className="text-sm text-gray-700">
                📅 {new Date(card.met_at).toLocaleDateString('ja-JP')}
                {card.met_context && ` — ${card.met_context}`}
              </p>
            )}
            {card.notes && <p className="text-sm text-gray-600 whitespace-pre-wrap">{card.notes}</p>}
          </div>
        )}

        {/* タグ */}
        {card.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {card.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* アーカイブボタン */}
        <ArchiveButton cardId={card.id} currentStatus={card.status} />
      </div>
    </div>
  )
}

function ArchiveButton({ cardId, currentStatus }: { cardId: number; currentStatus: string }) {
  const isArchived = currentStatus === 'archived'
  return (
    <form action={`/api/cards/${cardId}/status`} method="POST">
      <input type="hidden" name="status" value={isArchived ? 'active' : 'archived'} />
      <button
        type="submit"
        className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-colors ${
          isArchived
            ? 'border-green-200 text-green-600 hover:bg-green-50'
            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
        }`}
      >
        {isArchived ? '有効に戻す' : 'アーカイブする'}
      </button>
    </form>
  )
}
