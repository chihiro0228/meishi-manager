'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'

interface Props {
  defaultQ?: string
  defaultStatus?: string
}

export function CardSearch({ defaultQ = '', defaultStatus = 'active' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const updateSearch = useCallback(
    (q: string, status: string) => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (status !== 'active') params.set('status', status)
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname]
  )

  return (
    <div className="space-y-2">
      {/* 検索ボックス */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="search"
          defaultValue={defaultQ}
          onChange={(e) => updateSearch(e.target.value, defaultStatus)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="氏名・会社名・メールで検索..."
        />
        {isPending && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">...</span>
        )}
      </div>

      {/* ステータス切り替え */}
      <div className="flex gap-2">
        <button
          onClick={() => updateSearch(defaultQ, 'active')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            defaultStatus === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          有効
        </button>
        <button
          onClick={() => updateSearch(defaultQ, 'archived')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            defaultStatus === 'archived'
              ? 'bg-gray-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          アーカイブ
        </button>
      </div>
    </div>
  )
}
