import Link from 'next/link'
import Image from 'next/image'
import type { BusinessCard } from '@/lib/supabase/types'

interface Props {
  card: BusinessCard
  imageUrl?: string
}

export function CardItem({ card, imageUrl }: Props) {
  const initials = (card.full_name || card.company_name || '?')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Link href={`/cards/${card.id}`}>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
        {/* 名刺画像またはイニシャル */}
        <div className="relative w-full aspect-[1.77/1] bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
          {imageUrl ? (
            <Image src={imageUrl} alt={card.full_name || '名刺'} fill className="object-cover" />
          ) : (
            <span className="text-2xl font-bold text-blue-300">{initials}</span>
          )}
        </div>

        {/* 情報 */}
        <div className="p-3 space-y-0.5">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {card.full_name || '（名前なし）'}
          </p>
          {card.company_name && (
            <p className="text-xs text-gray-500 truncate">{card.company_name}</p>
          )}
          {(card.department || card.title) && (
            <p className="text-xs text-gray-400 truncate">
              {[card.department, card.title].filter(Boolean).join(' / ')}
            </p>
          )}
          {card.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap pt-1">
              {card.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
