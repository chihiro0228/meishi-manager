import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CardItem } from '@/components/cards/CardItem'
import { CardSearch } from '@/components/cards/CardSearch'

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function CardsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const q = params.q || ''
  const status = params.status || 'active'

  const supabase = await createClient()

  let query = supabase
    .from('business_cards')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,company_name.ilike.%${q}%,department.ilike.%${q}%,email.ilike.%${q}%`
    )
  }

  const { data: cards, error } = await query.limit(100)

  // 画像のsigned URLを取得
  const imageUrls: Record<number, string> = {}
  if (cards) {
    const paths = cards.filter((c) => c.image_path).map((c) => c.image_path as string)
    if (paths.length > 0) {
      const { data: signedUrls } = await supabase.storage
        .from('business-card-images')
        .createSignedUrls(paths, 3600)
      signedUrls?.forEach((item, i) => {
        const card = cards.find((c) => c.image_path === paths[i])
        if (card && item.signedUrl) imageUrls[card.id] = item.signedUrl
      })
    }
  }

  const totalCount = cards?.length ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📇</span>
            <h1 className="font-bold text-gray-900">名刺管理</h1>
          </div>
          <Link
            href="/cards/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + 追加
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* 検索 */}
        <CardSearch defaultQ={q} defaultStatus={status} />

        {/* 件数 */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {status === 'archived' ? 'アーカイブ' : '有効'}な名刺: {totalCount}件
          </p>
        </div>

        {/* エラー */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            データの取得に失敗しました: {error.message}
          </div>
        )}

        {/* 一覧 */}
        {cards && cards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cards.map((card) => (
              <CardItem key={card.id} card={card} imageUrl={imageUrls[card.id]} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📇</div>
            {q ? (
              <p className="text-sm">「{q}」に一致する名刺がありません</p>
            ) : (
              <>
                <p className="text-sm font-medium">名刺がまだありません</p>
                <p className="text-xs mt-1">右上の「+ 追加」から名刺を撮影してください</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
