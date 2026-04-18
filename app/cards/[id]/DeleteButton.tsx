'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteButton({ cardId }: { cardId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('この名刺を削除しますか？この操作は取り消せません。')) return
    setLoading(true)
    const res = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/cards')
      router.refresh()
    } else {
      const data = await res.json()
      alert(`削除に失敗しました: ${data.error}`)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      {loading ? '削除中...' : 'この名刺を削除する'}
    </button>
  )
}
